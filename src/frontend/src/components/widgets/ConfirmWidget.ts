// src/components/widgets/ConfirmWidget.ts

import type { UIWidget } from "../../types/index.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function ConfirmWidget(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "widget-confirm";

  const label = document.createElement("p");
  label.className = "widget-label";
  label.textContent = widget.label;
  wrap.appendChild(label);

  if (widget.description) {
    const desc = document.createElement("p");
    desc.className = "widget-description";
    desc.textContent = widget.description;
    wrap.appendChild(desc);
  }

  const btnRow = document.createElement("div");
  btnRow.className = "widget-confirm__buttons";

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = "btn btn-primary widget-confirm__yes";
  yesBtn.textContent = "Yes";
  yesBtn.setAttribute("aria-label", "Yes");
  yesBtn.addEventListener("click", () => {
    onSubmit({ field_key: widget.field_key, value: true });
    wrap.closest(".widget-container")?.remove();
  });

  const noBtn = document.createElement("button");
  noBtn.type = "button";
  noBtn.className = "btn btn-secondary widget-confirm__no";
  noBtn.textContent = "No";
  noBtn.setAttribute("aria-label", "No");
  noBtn.addEventListener("click", () => {
    onSubmit({ field_key: widget.field_key, value: false });
    wrap.closest(".widget-container")?.remove();
  });

  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);
  wrap.appendChild(btnRow);

  return wrap;
}
