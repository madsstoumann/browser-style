# Drug Driving Fine Calculator Component

This document provides a comprehensive overview of the "Drug Driving Fine Calculator" component, how to implement it, how its logic is structured, and how to integrate it with a backend CMS like Umbraco.

## 1. Frontend Implementation

To implement this component on a webpage, follow these steps:

1.  **Include the HTML:** Copy the entire `<form id="app">...</form>` block from `index.html` and place it in your desired location in the `<body>` of your page.

2.  **Link CSS and JavaScript:** Ensure that the stylesheet and the script are linked correctly. The CSS should be in the `<head>` and the JavaScript at the end of the `<body>`.

    ```html
    <head>
        ...
        <link rel="stylesheet" href="index.css">
    </head>
    <body>
        ...
        <!-- The form HTML goes here -->
        ...
        <script src="index.js" defer></script>
    </body>
    ```

3.  **Ensure Icons are Available:** The component uses SVG icons for different drugs and levels. These are stored in `icons.svg`. The component expects this file to be in the same directory and will fetch it automatically. No further action is needed if the file structure is maintained.

## 2. Backend Integration (Umbraco)

The component is built with static text, but it can easily be connected to a CMS like Umbraco to allow editors to manage the content.

To replace static text with dynamic content from Umbraco, you would replace the hardcoded text with Razor syntax.

**Example:**

The main headline:

```html
<!-- Static HTML -->
<h1>Narkokørsel koster kassen</h1>
```

Should be replaced with a property from your Umbraco model:

```csharp
// Example in Razor for Umbraco
<h1>@Model.Heading</h1>
```

This principle applies to all text content, including:
-   Header text and descriptions.
-   Field labels (`<legend class="label">`).
-   Button text (`<span>Ja</span>`, `<span>Nej</span>`).
-   Informational text in the results section.

An Umbraco developer should identify all static text and map it to corresponding properties on a Document Type.

## 3. Logic and Calculation Structure

The calculation logic is based on the rules outlined in `documentation.md`. The core factors determining the outcome are **substance type**, **level of substance in the blood**, **monthly income**, and **age of driver's license**.

The logic can be summarized as follows:

-   **Fine Calculation:**
    -   For a **low THC level**, the fine is calculated as `(Annual Income / 50)`.
    -   For **medium/high THC levels**, **other substances**, or **laughing gas**, the fine is `(Annual Income / 25)`.
    -   There is a minimum fine of 1,500 kr.

-   **Sanctions by Substance:**
    -   **Low THC Level (0.001-0.003 mg/kg):**
        -   Results in a "klip i kørekortet" (a point on the license).
        -   Does not require an ANT course or new driving tests.
    -   **Medium THC Level (0.003-0.009 mg/kg) or Laughing Gas (if driving is unsafe):**
        -   Results in either a "kørselsforbud" (driving ban for new drivers) or a "betinget frakendelse" (conditional revocation for experienced drivers).
        -   Requires an ANT course and new theory/practical driving tests.
    -   **High THC Level (>0.009 mg/kg) or Other Substances (Cocaine, Opioids, etc.):**
        -   Results in an "ubetinget frakendelse" (unconditional revocation) for 3 years.
        -   Requires an ANT course and new theory/practical driving tests.

-   **Laughing Gas (Lattergas):**
    -   Possession of laughing gas in a vehicle incurs a separate fine of 10,000 kr. for transporting dangerous goods.
    -   An additional fine is levied based on the amount possessed (3,000 kr. to 50,000 kr.).
    -   Driving while affected by it is treated similarly to a medium THC level offense if unsafe driving can be proven.

## 4. Output Field Descriptions

The following table details every output field in the component, what it represents, and the condition under which it is displayed.

| Field Name (`name`) | Description (from HTML) | Condition for Visibility |
| :--- | :--- | :--- |
| `inc_out` | Din månedsløn før skat | Always visible. |
| `inc_yer` | Årsindkomst før skat | Always visible. |
| `tot_fin` | Bødeestimat (Total fine estimate) | Always visible. |
| `ant_dsc` | ANT-kursus | Shown for all cases **except** low-level THC. |
| `lic_tst_dsc` | Ny teori- og køreprøve | Shown for all cases **except** low-level THC. |
| `lic_clp_dsc` | 1 klip i kørekortet | Shown **only** for low-level THC. |
| `drv_ban_dsc` | Kørselsforbud | Shown for medium THC or Gas, **if** license is newer than 3 years. |
| `cnd_dsq_dsc` | Betinget frakendelse | Shown for medium THC or Gas, **if** license is older than 3 years. |
| `unc_dsq_3ys` | Ubetinget frakendelse 3 år | Shown for high THC or any substance that is not THC or Gas. |
| `fin` | Bødestørrelse | Always visible in the breakdown. |
| `bld_ana` | Analyse af blodprøve | Always visible in the breakdown. |
| `doc_fee` | Udgift til læge | Always visible in the breakdown. |
| `vic_fnd` | Offerfonden | Shown for all cases **except** low-level THC. |
| `ant_crs` | ANT-kursus | Shown for all cases **except** low-level THC. |
| `lic_tst` | Ny teori- og køreprøve | Shown for all cases **except** low-level THC. |
| `gas_pos` | Besiddelse af lattergas | Shown **only** if Gas is selected and an amount is specified. |
| `gas_amt_out` | Mængde i besiddelse | Shown **only** if Gas is selected and an amount is specified. |
| `tot` | Totale udgifter (ca.) | Always visible in the breakdown. |
| `gas_pos_dsc` | Lattergas besiddelse info | Shown **only** if Gas is selected and an amount is specified. |
| `gas_inf_dsc` | Lattergas påvirkning info | Shown **only** if Gas is selected. |
