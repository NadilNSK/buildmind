# BuildMind AI v5.0 — Approved Feature Scope Specification

## 1. Scope Governance & Architectural Boundaries
BuildMind AI v5.0 is an enterprise-grade SaaS web application purpose-built for **AI-assisted Quantity Surveying (QS) and construction commercial management**.

The application is initially calibrated for the **Sri Lankan construction industry** (adhering to SLS 573, CIDA/ICTAD standard bidding documents, and local price build-ups) while establishing an extensible foundation for **international AEC markets** (NRM2, CESMM4, SMM7, POMI, and FIDIC contracts).

> [!IMPORTANT]
> **Approved Scope Boundary**: Exactly **24 capabilities** are approved across 4 categories. Under no circumstances should engineering teams expand into the **16 explicitly excluded features**.

---

## 2. The 24 Approved Core Capabilities

### Category A: 12 Quantity Surveying Domain Modules
1. **QS-01 Quantity Takeoff**: Automated and interactive geometric extraction of linear, area, volume, and count measurements from 2D vector PDFs, CAD (DWG/DXF), and 3D BIM models with measurement sheet audit logs.
2. **QS-02 Cost Estimation**: Analytical rate build-ups (labour gangs, plant norms, material constants, wastage, overheads, profit) with support for Sri Lankan CIDA (ICTAD) rate norms and foreign currency conversion.
3. **QS-03 BOQ Generation**: Hierarchical Bill of Quantities generator conforming strictly to standard methods of measurement (SLS 573, CESMM4, NRM2) with standard preambles and export facilities.
4. **QS-04 Budget Planning**: Commercial baseline budget locking, contingency drawdown registers, and monthly S-curve cash flow disbursement forecasting.
5. **QS-05 Tender Management**: Subcontractor/supplier tender packaging, automated addenda distribution, bid evaluation matrices, and commercial outlier rate detection.
6. **QS-06 Contract Administration**: Contractual milestone tracking, formal notice countdowns (e.g. FIDIC Clause 20.1 / CIDA conditions), performance bonds, and insurance trackers.
7. **QS-07 Procurement Management**: Material requisitioning tied to BOQ allowances, supplier quotation comparisons, and purchase order tracking.
8. **QS-08 Cost Control & Monitoring**: Earned Value Management (EVM) tracking (PV, EV, AC, CV, SV, CPI), Cost-to-Complete (CTC) forecasts, and trade cost heatmaps.
9. **QS-09 Interim Payment Valuation**: Monthly contractor payment application certification, work-done tracking, retention deductions, and advance payment recovery calculations.
10. **QS-10 Variation Management**: Formal Variation Order (VO) registers, clause-based rate derivations (contract rates, pro-rata, star/daywork build-ups), and cumulative financial impact tracking.
11. **QS-11 Risk & Value Engineering**: Quantitative commercial risk registers (Probability × Impact) and value optimization trade-off proposals.
12. **QS-12 Final Account Preparation**: Final measurement reconciliation, liquidated damages settlement, retention release, and legal discharge documentation.

### Category B: 7 Enterprise Shared Systems
13. **ES-01 Measurement Standards Engine**: Rules database and deduction logic for SLS 573, SMM7, NRM2, POMI, and CESMM4.
14. **ES-02 Construction Specifications Engine**: Standard specification clause linkage (CIDA Standard Specifications, MasterFormat).
15. **ES-03 Contract Rules Engine**: Evaluation of FIDIC Red/Yellow and CIDA SBD-01/02/03 conditions and clause dependencies.
16. **ES-04 Drawing Revision Management**: Cloud-delta revision comparisons, geometric change highlighting, and visual discrepancy logs.
17. **ES-05 Document Control**: Transmittal, submittal, and RFI registers with full provenance and audit tracking.
18. **ES-06 Commercial Reporting**: Multi-format commercial reporting (Executive dashboards, client cost reports, CIDA-compliant printouts).
19. **ES-07 Quality Assurance & Audit**: Immutable event logging for every measurement edit, rate change, variation approval, and certification.

### Category C: 1 Smart Selective Scope Engine
20. **SSQ-01 Smart Selective QS**: Multi-granularity takeoff scoping allowing selective quantification by full project, building floor, individual room, structural element, custom polygon, trade package, or inclusion/exclusion boundaries.

### Category D: 4 Approved Advanced Features
21. **AF-01 AI Auto-Detection & One-Click Takeoff**: Computer-vision assisted element deduction (walls, slabs, doors, windows); calculations remain strictly user-confirmed and deterministic.
22. **AF-02 Interactive 3D BIM Viewer**: High-performance browser-based IFC / glTF model viewer with direct element property quantity extraction.
23. **AF-03 AI Drawing Conflict Detection**: Cross-discipline discrepancy identification between structural and architectural drawing revisions.
24. **AF-04 Conversational QS Copilot**: Domain-specialized assistant performing retrieval-augmented generation over project BOQs, contracts, specifications, and drawing revisions.

---

## 3. The 16 Explicitly Excluded Features (Out of Scope)
The following features are **strictly out of scope** and must never be implemented:

1. **General Corporate Accounting / ERP**: General ledger, corporate payroll, and company balance sheets (belongs in external ERP systems like SAP/NetSuite).
2. **HR & Personnel Management**: Employee lifecycle, staff onboarding, leave management.
3. **Site Biometric Attendance Systems**: Hardware timeclocks and site turnstile integrations.
4. **Heavy Equipment Telematics**: GPS tracking of excavators, fuel sensors, engine diagnostics.
5. **Autonomous Drone Flight Piloting**: Drone mission path programming and hardware piloting.
6. **Robotics Control Systems**: Autonomous bricklaying or site scanning robots.
7. **Generative CAD Architectural Design**: AI generation of architectural building geometries from text.
8. **Structural Finite Element Analysis (FEA)**: Structural stress calculations, seismic moment modeling.
9. **Energy & Green Building Certification Modeling**: LEED/BREEAM thermal simulation.
10. **Sales & Marketing CRM**: Real estate buyer leads, broker commissions, sales funnels.
11. **B2B Payment Gateway Processing**: Direct banking disbursement, automated ACH wire execution.
12. **Cryptocurrency & Web3 Escrow**: Smart contract crypto payments or blockchain tokens.
13. **Post-Occupancy Facility Management**: Tenant maintenance ticketing and lease administration.
14. **Site Safety IoT Streaming Sensors**: Real-time worker wearable telemetry and helmet impact sensors.
15. **Meteorological Weather Radar Simulation**: Live weather Doppler modeling.
16. **Direct Government Tax Electronic Filing**: Automatic electronic transmission to Sri Lanka Inland Revenue or foreign tax portals.
