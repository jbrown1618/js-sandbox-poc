import { useState, useRef, useEffect } from "react";

const iframeOrigin = "http://localhost:5175";

export function JsSandbox() {
  const [inputValue, setInputValue] = useState(exampleInput);
  const [code, setCode] = useState(exampleFunction);

  const { iframeRef, output, error } = useSandboxedExecution(code, inputValue);

  return (
    <div style={{ padding: 100, display: "flex", flexDirection: "column" }}>
      <h1>Sandboxed code execution demo</h1>
      <h2>Input</h2>
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
      ) : (
        <>
          <h2>Output</h2>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </>
      )}
      <iframe src={iframeOrigin} ref={iframeRef} />
    </div>
  );
}

function useSandboxedExecution(code: string, input: string) {
  const [output, setOutput] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.postMessage(
      {
        type: "FUNCTION_BODY",
        functionBody: code,
      },
      iframeOrigin
    );
  }, [code]);

  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.postMessage(
      {
        type: "FUNCTION_ARGUMENT",
        functionArgument: input,
      },
      iframeOrigin
    );
  }, [input]);

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
