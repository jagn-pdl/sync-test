// src/components/widgets/WidgetRenderer.ts

import type { UIWidget } from "../../types/index.js";
import { SliderWidget } from "./SliderWidget.js";
import { RadioWidget } from "./RadioWidget.js";
import { CheckboxWidget } from "./CheckboxWidget.js";
import { ScaleWidget } from "./ScaleWidget.js";
import { TextInputWidget } from "./TextInputWidget.js";
import { DatePickerWidget } from "./DatePickerWidget.js";
import { MultiSelectWidget } from "./MultiSelectWidget.js";
import { ConfirmWidget } from "./ConfirmWidget.js";

type SubmitFn = (value: { field_key: string; value: unknown }) => void;

export function WidgetRenderer(widget: UIWidget, onSubmit: SubmitFn): HTMLElement {
  const container = document.createElement("div");
  container.className = "widget-container animate-widget";
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", widget.label);

  let inner: HTMLElement;

  switch (widget.type) {
    case "slider":
      inner = SliderWidget(widget, onSubmit);
      break;
    case "radio_group":
      inner = RadioWidget(widget, onSubmit);
      break;
    case "checkbox_group":
      inner = CheckboxWidget(widget, onSubmit);
      break;
    case "scale_rating":
      inner = ScaleWidget(widget, onSubmit);
      break;
    case "text_input":
    case "number_input":
      inner = TextInputWidget(widget, onSubmit);
      break;
    case "date_picker":
      inner = DatePickerWidget(widget, onSubmit);
      break;
    case "multi_select":
      inner = MultiSelectWidget(widget, onSubmit);
      break;
    case "confirm":
      inner = ConfirmWidget(widget, onSubmit);
      break;
    default: {
      // Exhaustive guard — TypeScript will warn if a type is unhandled
      const _exhaustive: never = widget.type;
      inner = document.createElement("div");
      break;
    }
  }

  container.appendChild(inner);
  return container;
}
