sap.ui.define([
   "sap/ui/core/UIComponent",
   "sap/ui/model/json/JSONModel",
], (UIComponent, JSONModel) => {
   "use strict";

   return UIComponent.extend("aayush.Component", {
        metadata : {
         "interfaces": ["sap.ui.core.IAsyncContentCreation"],
         "manifest": "json"
      },

      init() {
         UIComponent.prototype.init.apply(this, arguments);

const oData = {
    // ── Navigation state ──────────────────────────
    showOperationSelector: true,
    showCreatePanel:       false,
    showReadPanel:         false,
    showUpdatePanel:       false,
    showDeletePanel:       false,
    showDetailPanel:       false,
    editItemMode:          false,

    // ── Read panel data ───────────────────────────
    POHeader:              [],
    POItems:               [],

    // ── Detail panel state ────────────────────────
    selectedPO:            {},
    selectedPOItems:       [],

    // ── Update panel — two search inputs ──────────
    searchEBELN:           "",   // PO Number
    searchEBELP:           "",   // Item Number
    editItemPayload:       {},

    // ── Delete panel state ────────────────────────
    deleteEBELN:           "",
    showDeleteResult:      false,
    deletePOResults:       [],

    // ── F4 help lists ─────────────────────────────
    vendorList: [
        { LIFNR: "V001", NAME: "Bosch Ltd",         CITY: "Stuttgart" },
        { LIFNR: "V002", NAME: "Tata Steel",         CITY: "Mumbai" },
        { LIFNR: "V003", NAME: "Siemens AG",         CITY: "Munich" },
        { LIFNR: "V004", NAME: "Mahindra Logistics", CITY: "Pune" },
        { LIFNR: "V005", NAME: "ABB India",          CITY: "Bengaluru" },
    ],
    materialList: [
        { MATNR: "MAT001", MAKTX: "Brake Disc",      MATKL: "ROH" },
        { MATNR: "MAT002", MAKTX: "Fuel Injector",   MATKL: "ROH" },
        { MATNR: "MAT003", MAKTX: "Spark Plug",      MATKL: "ROH" },
        { MATNR: "MAT004", MAKTX: "Steel Sheet 2mm", MATKL: "ROH" },
        { MATNR: "MAT005", MAKTX: "Bearing 6205",    MATKL: "ROH" },
    ],

    // ── Create payload ────────────────────────────
    createPayload: {
        EBELN:    "",
        BUKRS:    "",
        BSART:    "",
        LIFNR:    "",
        AEDAT:    new Date().toISOString().split('T')[0],
        ZTERM:    "",
        currency: "",
        items: [{
            EBELP:        10,
            MATNR:        "",
            MAKTX_display: "",   // display field — not sent to backend
            MENGE:        null,
            MEINS:        "",
            WERKS:        "",
            NETPR:        null
        }]
    }
};
         const oModel = new JSONModel(oData);
         this.setModel(oModel, "ui");
      }
   });
});