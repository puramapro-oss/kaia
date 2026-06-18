import { describe, it, expect } from "vitest";
import { detectFiscalProfile, summarizeAnnualRevenue } from "./profiles";
import { estimateUrssafContribution } from "./urssaf";

describe("detectFiscalProfile", () => {
  it("prioritizes student status", () => {
    expect(detectFiscalProfile({ isStudent: true }).key).toBe("etudiant");
    expect(detectFiscalProfile({ employmentStatus: "student" }).key).toBe("etudiant");
  });

  it("maps freelance and portage", () => {
    expect(detectFiscalProfile({ employmentStatus: "freelance" }).key).toBe("freelance_ae");
    expect(detectFiscalProfile({ employmentStatus: "portage" }).key).toBe("salarie_portage");
  });

  it("defaults to standard employee", () => {
    expect(detectFiscalProfile({}).key).toBe("salarie_standard");
    expect(detectFiscalProfile({ employmentStatus: "employee" }).key).toBe("salarie_standard");
  });
});

describe("summarizeAnnualRevenue", () => {
  it("sums revenue sources", () => {
    const s = summarizeAnnualRevenue({ karmaCents: 5_000, primesCents: 10_000, referralCents: 2_500 });
    expect(s.totalCents).toBe(17_500);
  });

  it("applies the 34% micro-BNC allowance to the taxable base", () => {
    const s = summarizeAnnualRevenue({ karmaCents: 10_000, primesCents: 0, referralCents: 0 });
    expect(s.microBncTaxableCents).toBe(6_600);
  });

  it("clamps negative inputs to zero", () => {
    const s = summarizeAnnualRevenue({ karmaCents: -100, primesCents: 5_000, referralCents: 0 });
    expect(s.karmaCents).toBe(0);
    expect(s.totalCents).toBe(5_000);
  });
});

describe("estimateUrssafContribution", () => {
  it("estimates ~22% of gross", () => {
    const e = estimateUrssafContribution(10_000);
    expect(e.contributionCents).toBe(2_200);
  });

  it("clamps negatives", () => {
    expect(estimateUrssafContribution(-50).contributionCents).toBe(0);
  });
});
