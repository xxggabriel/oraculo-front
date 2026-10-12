import { Component, input } from "@angular/core";
import { Distribution } from "../../../core/search";
import { civilDate, fieldLabels, number } from "../../format";
@Component({
  selector: "app-distribution-table",
  standalone: true,
  host: { class: "block" },
  templateUrl: "./distribution-table.component.html",
})
export class DistributionTableComponent {
  readonly distribution = input.required<Distribution>();
  readonly civilDate = civilDate;
  readonly fieldLabels = fieldLabels;
  readonly number = number;
  width(count: number, buckets: readonly { count: number }[]) {
    return `${(count / Math.max(...buckets.map((b) => b.count), 1)) * 100}%`;
  }
}
