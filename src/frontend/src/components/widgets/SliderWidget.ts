// src/components/widgets/SliderWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function SliderWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-slider";

  const label = document.createElement("label");
  label.className = "widget-label";
  label.textContent = widget.label;
  label.htmlFor = `slider-${widget.widget_id}`;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  const min = widget.min ?? 0;
  const max = widget.max ?? 100;
  const step = widget.step ?? 1;
  const mid = Math.round((min + max) / 2);

  const valueDisplay = document.createElement("span");
  valueDisplay.className = "widget-slider__value";
  valueDisplay.textContent = `${mid}${widget.unit ? " " + widget.unit : ""}`;

  const input = document.createElement("input");
  input.type = "range";
  input.id = `slider-${widget.widget_id}`;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(mid);
  input.className = "widget-slider__input";
  input.setAttribute("aria-valuemin", String(min));
  input.setAttribute("aria-valuemax", String(max));
  input.setAttribute("aria-valuenow", String(mid));

  input.addEventListener("input", () => {
    valueDisplay.textContent = `${input.value}${widget.unit ? " " + widget.unit : ""}`;
    input.setAttribute("aria-valuenow", input.value);
  });

  wrap.appendChild(input);
  wrap.appendChild(valueDisplay);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "widget-submit-btn btn btn-primary";
  submitBtn.textContent = "Confirm";
  submitBtn.setAttribute("aria-label", `Confirm ${widget.label}`);
  submitBtn.addEventListener("click", () => {
    onSubmit({ field_key: widget.field_key, value: Number(input.value) });
    wrap.closest(".widget-container")?.remove();
  });
  wrap.appendChild(submitBtn);

  return wrap;
}
