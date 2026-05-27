// src/components/widgets/RadioWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function RadioWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-radio-group";
  wrap.setAttribute("role", "radiogroup");
  wrap.setAttribute("aria-labelledby", `radio-label-${widget.widget_id}`);

  const label = document.createElement("p");
  label.className = "widget-label";
  label.id = `radio-label-${widget.widget_id}`;
  label.textContent = widget.label;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  let selectedValue: string | null = null;
  const options = widget.options ?? [];

  const optionEls: HTMLElement[] = [];

  options.forEach((opt) => {
    const optionWrap = document.createElement("label");
    optionWrap.className = "widget-radio-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `radio-${widget.widget_id}`;
    input.value = opt;
    input.setAttribute("aria-label", opt);

    input.addEventListener("change", () => {
      selectedValue = opt;
      optionEls.forEach((el) => el.classList.remove("widget-radio-option--selected"));
      optionWrap.classList.add("widget-radio-option--selected");
    });

    const optLabel = document.createElement("span");
    optLabel.textContent = opt;

    optionWrap.appendChild(input);
    optionWrap.appendChild(optLabel);
    wrap.appendChild(optionWrap);
    optionEls.push(optionWrap);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "widget-submit-btn btn btn-primary";
  submitBtn.textContent = "Confirm";
  submitBtn.setAttribute("aria-label", `Confirm ${widget.label}`);
  submitBtn.addEventListener("click", () => {
    if (!selectedValue && widget.required) return;
    onSubmit({ field_key: widget.field_key, value: selectedValue });
    wrap.closest(".widget-container")?.remove();
  });
  wrap.appendChild(submitBtn);

  return wrap;
}
