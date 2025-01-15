import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const parentOrigin = "http://localhost:5174";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

window.addEventListener("message", (e) => {
  console.log(e.data);
  switch (e.data.type) {
    case "FUNCTION_BODY":
      setFunctionBody(e.data.functionBody);
      return;
    case "FUNCTION_ARGUMENT":
      setInputValue(e.data.functionArgument);
      return;
    case "REACT_COMPONENT":
      return;
    case "COMPONENT_PROPS":
      return;
    default:
      return;
  }
});

const SCRIPT_ID = "executable-script";

// let execute: (arg: unknown) => unknown = () => {};
let arg: unknown = undefined;

function setFunctionBody(functionBody: string) {
  let script = document.querySelector(`#${SCRIPT_ID}`);
  if (script) {
    document.head.removeChild(script);
    // @ts-expect-error TODO
    if (execute) {
      // @ts-expect-error TODO
      execute = undefined;
    }
  }

  script = document.createElement("script");
  script.id = "executable-script";

  try {
    script.innerHTML = functionBody;
    document.head.append(script);
  } catch (e) {
    window.parent.postMessage({ type: "ERROR", error: e }, parentOrigin);
  }

  executeFunction();
}

function setInputValue(value: string) {
  arg = JSON.parse(value);

  executeFunction();
}

async function executeFunction() {
  try {
    // @ts-expect-error TODO
    const result = await execute(arg);
    window.parent.postMessage(
      { type: "RETURN_VALUE", returnValue: result },
      parentOrigin
    );
  } catch (e) {
    window.parent.postMessage({ type: "ERROR", error: e }, parentOrigin);
  }
}
