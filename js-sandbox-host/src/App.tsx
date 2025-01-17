import { useState, useRef, useEffect } from "react";

const iframeOrigin = "http://localhost:5175";

export function JsSandbox() {
  const [mode, setMode] = useState<"function" | "component">("function");
  const [code, setCode] = useState(exampleFunction);
  const [inputValue, setInputValue] = useState(exampleInput);

  const { iframeRef, output, error } = useSandboxedExecution(
    mode,
    code,
    inputValue
  );

  return (
    <div style={{ padding: 100, display: "flex", flexDirection: "column" }}>
      <h1>Sandboxed code execution demo</h1>
      <select
        value={mode}
        onChange={(e) => {
          const mode: "function" | "component" =
            e.target.value === "function" ? "function" : "component";
          setCode(mode === "function" ? exampleFunction : exampleComponent);
          setInputValue(mode === "function" ? exampleInput : exampleProps);
          setMode(mode);
        }}
      >
        <option value="function">Function invocation</option>
        <option value="component">React component</option>
      </select>
      <h2>{mode === "function" ? "Input" : "Props"}</h2>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <h2>Code</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
      />

      {error ? (
        <div style={{ color: "red" }}>
          <h2>Error</h2>
          <pre>
            {error instanceof Error
              ? error.message
              : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      ) : mode === "function" ? (
        <>
          <h2>Output</h2>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </>
      ) : null}
      <iframe
        sandbox="allow-scripts allow-same-origin"
        src={iframeOrigin}
        ref={iframeRef}
        style={mode === "function" ? { display: "none" } : undefined}
      />
    </div>
  );
}

function useSandboxedExecution(
  mode: "function" | "component",
  code: string,
  input: string
) {
  const [output, setOutput] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => setIframeReady(true);

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  });

  useEffect(() => {
    if (!iframeReady) return;
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.postMessage(
      {
        type: mode === "function" ? "FUNCTION_BODY" : "REACT_COMPONENT",
        functionBody: code,
      },
      iframeOrigin
    );
  }, [code, mode, iframeReady]);

  useEffect(() => {
    if (!iframeReady) return;
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.postMessage(
      {
        type: mode === "function" ? "FUNCTION_ARGUMENT" : "REACT_PROPS",
        functionArgument: input,
      },
      iframeOrigin
    );
  }, [input, mode, iframeReady]);

  useEffect(() => {
    const onCodeResult = (e: MessageEvent) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow) return;

      if (e.source !== iframeWindow) return;

      console.log(e.data);
      switch (e.data.type) {
        case "RETURN_VALUE":
          setOutput(e.data.returnValue);
          setError(null);
          return;
        case "ERROR":
          setError(e.data.error);
          setOutput(null);
          return;
        default:
          return;
      }
    };

    window.addEventListener("message", onCodeResult);
    return () => window.removeEventListener("message", onCodeResult);
  }, []);

  return { output, error, iframeRef };
}

const exampleFunction = `async function execute(input) {
  const res = await fetch('https://api.github.com/repos/' + input.nwo)
  const repo = await res.json()
  return {
    name: repo.name,
    stars: repo.subscribers_count
  };
}`;

const exampleInput = '{ "nwo": "facebook/react" }';

const exampleComponent = `function MyComponent(props) {
  const [count, setCount] = React.useState(0)

  return React.createElement("div", {}, 
    React.createElement("h2", {}, props.message),
    React.createElement("p", {}, "Count: " + count),
    React.createElement("button", { onClick: () => setCount(c => c + 1)}, "Increment")
  );
}`;

const exampleProps = `{ "message": "Dynamic react component" }`;
