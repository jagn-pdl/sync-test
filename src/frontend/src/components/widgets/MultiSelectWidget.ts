// src/components/widgets/MultiSelectWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function MultiSelectWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-multi-select";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-labelledby", `ms-label-${widget.widget_id}`);

  const label = document.createElement("p");
  label.className = "widget-label";
  label.id = `ms-label-${widget.widget_id}`;
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

  const chipRow = document.createElement("div");
  chipRow.className = "widget-multi-select__chips";

  options.forEach((opt) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "widget-multi-select__chip";
    chip.textContent = opt;
    chip.setAttribute("aria-pressed", "false");
    chip.setAttribute("aria-label", opt);

    chip.addEventListener("click", () => {
      if (selected.has(opt)) {
        selected.delete(opt);
        chip.classList.remove("widget-multi-select__chip--selected");
        chip.setAttribute("aria-pressed", "false");
      } else {
        selected.add(opt);
        chip.classList.add("widget-multi-select__chip--selected");
        chip.setAttribute("aria-pressed", "true");
      }
    });

    chipRow.appendChild(chip);
  });

  wrap.appendChild(chipRow);

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
