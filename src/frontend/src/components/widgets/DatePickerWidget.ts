// src/components/widgets/DatePickerWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function DatePickerWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-date-picker";

  const label = document.createElement("label");
  label.className = "widget-label";
  label.textContent = widget.label;
  label.htmlFor = `date-${widget.widget_id}`;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  const input = document.createElement("input");
  input.type = "date";
  input.id = `date-${widget.widget_id}`;
  input.className = "input widget-date-input";
  input.setAttribute("aria-label", widget.label);

  wrap.appendChild(input);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "widget-submit-btn btn btn-primary";
  submitBtn.textContent = "Confirm";
  submitBtn.setAttribute("aria-label", `Confirm ${widget.label}`);
  submitBtn.addEventListener("click", () => {
    const val = input.value;
    if (!val && widget.required) return;
    onSubmit({ field_key: widget.field_key, value: val });
    wrap.closest(".widget-container")?.remove();
  });
  wrap.appendChild(submitBtn);

  return wrap;
}
