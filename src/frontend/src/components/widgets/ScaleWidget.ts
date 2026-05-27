// src/components/widgets/ScaleWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function ScaleWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-scale";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-labelledby", `scale-label-${widget.widget_id}`);

  const label = document.createElement("p");
  label.className = "widget-label";
  label.id = `scale-label-${widget.widget_id}`;
  label.textContent = widget.label;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  const min = widget.min ?? 1;
  const max = widget.max ?? 10;
  let selectedValue: number | null = null;
  const buttons: HTMLButtonElement[] = [];

  const scaleRow = document.createElement("div");
  scaleRow.className = "widget-scale__row";

  for (let i = min; i <= max; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "widget-scale__btn";
    btn.textContent = String(i);
    btn.setAttribute("aria-label", `${i} out of ${max}`);
    btn.setAttribute("aria-pressed", "false");

    const val = i;
    btn.addEventListener("click", () => {
      selectedValue = val;
      buttons.forEach((b) => {
        b.classList.remove("widget-scale__btn--selected");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("widget-scale__btn--selected");
      btn.setAttribute("aria-pressed", "true");
    });

    buttons.push(btn);
    scaleRow.appendChild(btn);
  }

  wrap.appendChild(scaleRow);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "widget-submit-btn btn btn-primary";
  submitBtn.textContent = "Confirm";
  submitBtn.setAttribute("aria-label", `Confirm ${widget.label}`);
  submitBtn.addEventListener("click", () => {
    if (selectedValue === null && widget.required) return;
    onSubmit({ field_key: widget.field_key, value: selectedValue });
    wrap.closest(".widget-container")?.remove();
  });
  wrap.appendChild(submitBtn);

  return wrap;
}
