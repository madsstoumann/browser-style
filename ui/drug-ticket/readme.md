# DUI Fine Calculator Component

This document provides a comprehensive overview of the "DUI Fine Calculator" component, how to implement it, how its logic is structured, and how to integrate it with a backend CMS.

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

## 2. Backend Integration

The component is built with static text, but it can easily be connected to a CMS to allow editors to manage the content.

To replace static text with dynamic content, you would replace the hardcoded text with your template syntax.

**Example:**

The main headline:

```html
<!-- Static HTML -->
<h1>What does it cost to drive with illegal drugs in your blood?</h1>
```

Should be replaced with a property from your CMS model:

```html
<!-- Example -->
<h1>{{ Model.Heading }}</h1>
```

This principle applies to all text content, including:
-   Header text and descriptions.
-   Field labels (`<legend class="label">`).
-   Button text.
-   Informational text in the results section.

## 3. Logic and Calculation Structure

The calculation logic is based on general DUI guidelines. The core factors determining the outcome are **substance type**, **level of substance in the blood**, **annual income**, and **age of driver's license**.

The logic can be summarized as follows:

-   **Fine Calculation:**
    -   For a **low THC level**, the fine is calculated as `(Annual Income / 50)`.
    -   For **medium/high THC levels**, **other substances**, or **nitrous oxide**, the fine is `(Annual Income / 25)`.
    -   There is a minimum fine of $500.

-   **Sanctions by Substance:**
    -   **Low THC Level (0.001-0.003 mg/kg):**
        -   Results in 1 penalty point on the license.
        -   Does not require a DUI course or new driving tests.
    -   **Medium THC Level (0.003-0.009 mg/kg) or Nitrous Oxide (if driving is unsafe):**
        -   Results in either a "driving ban" (for new drivers < 3 years) or a "conditional revocation" (for experienced drivers > 3 years).
        -   Requires a DUI course and new theory/practical driving tests.
    -   **High THC Level (>0.009 mg/kg) or Other Substances (Cocaine, Opioids, etc.):**
        -   Results in an "unconditional revocation" for 3 years.
        -   Requires a DUI course and new theory/practical driving tests.

-   **Nitrous Oxide:**
    -   Possession of nitrous oxide in a vehicle incurs a separate fine of $1,500 for transporting dangerous goods.
    -   An additional fine is levied based on the amount possessed ($500 to $7,500).
    -   Driving while affected by it is treated similarly to a medium THC level offense if unsafe driving can be proven.

## 4. Output Field Descriptions

The following table details every output field in the component, what it represents, and the condition under which it is displayed.

| Field Name (`name`) | Description (from HTML) | Condition for Visibility |
| :--- | :--- | :--- |
| `inc_out` | Annual income before tax | Always visible. |
| `tot_fin` | Total fine estimate | Always visible. |
| `ant_dsc` | DUI Course | Shown for all cases **except** low-level THC. |
| `lic_tst_dsc` | New theory and driving test | Shown for all cases **except** low-level THC. |
| `lic_clp_dsc` | 1 penalty point on license | Shown **only** for low-level THC. |
| `drv_ban_dsc` | Driving ban | Shown for medium THC or Gas, **if** license is newer than 3 years. |
| `cnd_dsq_dsc` | License revoked conditionally | Shown for medium THC or Gas, **if** license is older than 3 years. |
| `unc_dsq_3ys` | License revoked unconditionally for 3 years | Shown for high THC or any substance that is not THC or Gas. |
| `fin` | Fine amount | Always visible in the breakdown. |
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
