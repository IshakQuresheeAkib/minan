"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";

const sizeChart = [
  { size: "S", chest: "86–91 cm", length: "66 cm", shoulder: "42 cm" },
  { size: "M", chest: "91–97 cm", length: "68 cm", shoulder: "44 cm" },
  { size: "L", chest: "97–102 cm", length: "70 cm", shoulder: "46 cm" },
  { size: "XL", chest: "102–107 cm", length: "72 cm", shoulder: "48 cm" },
] as const;

export function SizeGuideModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="h-auto border-0 bg-transparent p-0 text-sm font-semibold text-primary shadow-none hover:bg-transparent hover:text-primary hover:shadow-none"
        >
          Size guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Size guide</DialogTitle>
          <DialogDescription>
            Approximate body measurements. Sizes may vary slightly by style.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Chest</th>
                <th className="py-2 pr-4 font-medium">Length</th>
                <th className="py-2 font-medium">Shoulder</th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((row) => (
                <tr key={row.size} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-semibold text-foreground">
                    {row.size}
                  </td>
                  <td className="py-2.5 pr-4 text-foreground/80">
                    {row.chest}
                  </td>
                  <td className="py-2.5 pr-4 text-foreground/80">
                    {row.length}
                  </td>
                  <td className="py-2.5 text-foreground/80">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
