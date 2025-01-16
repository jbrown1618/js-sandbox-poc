import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

globalThis.React = React;

const parentOrigin = "http://localhost:5174";

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
      setComponent(e.data.functionBody);
      return;
    case "REACT_PROPS":
      setProps(e.data.functionArgument);
      return;
    default:
      return;
  }
});

const SCRIPT_ID = "executable-script";

// let execute: (arg: unknown) => unknown = () => {};
let arg: unknown = undefined;

function setFunctionBody(functionBody: string) {
  writeFunctionDefinitionToDocument(functionBody);
  executeFunction();
}

function setComponent(functionBody: string) {
  writeFunctionDefinitionToDocument(functionBody);
  renderComponent();
}

function writeFunctionDefinitionToDocument(functionBody: string) {
  let script = document.querySelector(`#${SCRIPT_ID}`);
  if (script) {
    document.head.removeChild(script);
    // @ts-expect-error TODO
    if (globalThis.execute) {
      // @ts-expect-error TODO
      globalThis.execute = undefined;
    }
    // @ts-expect-error TODO
    if (globalThis.MyComponent) {
      // @ts-expect-error TODO
      globalThis.MyComponent = undefined;
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
}

function setInputValue(value: string) {
  arg = JSON.parse(value);
  executeFunction();
}

function setProps(value: string) {
  arg = JSON.parse(value);
  renderComponent();
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

const root = createRoot(document.getElementById("root")!);
function renderComponent() {
  root.render(null);
  root.render(
    <StrictMode>
      {/* @ts-expect-error TODO */}
      {MyComponent && arg ? (
        // @ts-expect-error TODO
        <MyComponent {...arg} />
      ) : (
        <div>Write a component</div>
      )}
    </StrictMode>
  );
}
