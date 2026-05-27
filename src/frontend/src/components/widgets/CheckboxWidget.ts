// src/components/widgets/CheckboxWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function CheckboxWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-checkbox-group";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-labelledby", `cb-label-${widget.widget_id}`);

  const label = document.createElement("p");
  label.className = "widget-label";
  label.id = `cb-label-${widget.widget_id}`;
  label.textContent = widget.label;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  const selected = new Set<string>();
  const options = widget.options ?? [];

  options.forEach((opt) => {
    const itemWrap = document.createElement("label");
    itemWrap.className = "widget-checkbox-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = opt;
    input.setAttribute("aria-label", opt);

    input.addEventListener("change", () => {
      if (input.checked) {
        selected.add(opt);
        itemWrap.classList.add("widget-checkbox-item--checked");
      } else {
        selected.delete(opt);
        itemWrap.classList.remove("widget-checkbox-item--checked");
      }
    });

    const optLabel = document.createElement("span");
    optLabel.textContent = opt;

    itemWrap.appendChild(input);
    itemWrap.appendChild(optLabel);
    wrap.appendChild(itemWrap);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "widget-submit-btn btn btn-primary";
  submitBtn.textContent = "Confirm";
  submitBtn.setAttribute("aria-label", `Confirm ${widget.label}`);
  submitBtn.addEventListener("click", () => {
    onSubmit({ field_key: widget.field_key, value: Array.from(selected) });
    wrap.closest(".widget-container")?.remove();
  });
  wrap.appendChild(submitBtn);

  return wrap;
}
