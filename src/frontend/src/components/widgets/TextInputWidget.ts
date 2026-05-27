// src/components/widgets/TextInputWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function TextInputWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-text-input";

  const label = document.createElement("label");
  label.className = "widget-label";
  label.textContent = widget.label;
  label.htmlFor = `text-${widget.widget_id}`;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  const isNumber = widget.type === "number_input";
  const isMultiline = !isNumber && !widget.options;

  let inputEl: HTMLInputElement | HTMLTextAreaElement;

  if (isMultiline) {
    const ta = document.createElement("textarea");
    ta.id = `text-${widget.widget_id}`;
    ta.className = "input textarea";
    ta.rows = 3;
    ta.placeholder = widget.description ?? "";
    ta.setAttribute("aria-label", widget.label);
    inputEl = ta as unknown as HTMLInputElement;
  } else {
    const inp = document.createElement("input");
    inp.id = `text-${widget.widget_id}`;
    inp.className = "input";
    inp.type = isNumber ? "number" : "text";
    inp.placeholder = widget.description ?? "";
    if (isNumber && widget.min !== null) inp.min = String(widget.min);
    if (isNumber && widget.max !== null) inp.max = String(widget.max);
    if (isNumber && widget.step !== null) inp.step = String(widget.step);
    inp.setAttribute("aria-label", widget.label);
    inputEl = inp;
  }

  wrap.appendChild(inputEl);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "widget-submit-btn btn btn-primary";
  submitBtn.textContent = "Confirm";
  submitBtn.setAttribute("aria-label", `Confirm ${widget.label}`);
  submitBtn.addEventListener("click", () => {
    const raw = inputEl.value.trim();
    if (!raw && widget.required) return;
    const value = isNumber ? Number(raw) : raw;
    onSubmit({ field_key: widget.field_key, value });
    wrap.closest(".widget-container")?.remove();
  });
  wrap.appendChild(submitBtn);

  return wrap;
}
