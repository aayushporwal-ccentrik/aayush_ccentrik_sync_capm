sap.ui.define([
   "sap/ui/core/UIComponent",
   "sap/ui/model/json/JSONModel",
], (UIComponent, JSONModel) => {
   "use strict";

   return UIComponent.extend("aayush.Component", {
        metadata : {
         "interfaces": ["sap.ui.core.IAsyncContentCreation"],
         /* CHANGE 1: Point to the Manifest. By adding this line, 
            you don't need to define rootView here. It will read it from manifest.json */
         "manifest": "json"
      },

      init() {
         // call the init function of the parent
         UIComponent.prototype.init.apply(this, arguments);
         // set data model
const oData = {
    // ── Navigation state ──────────────────────────
    showOperationSelector: true,
    showCreatePanel:       false,
    showReadPanel:         false,
    showUpdatePanel:       false,
    editItemMode:          false,

    // ── Read panel data ───────────────────────────
    POHeader:              [],
    POItems:               [],

    // ── Update panel state ────────────────────────
    searchItemId:          "",
    editItemPayload:       {},

    // ── F4 help lists ─────────────────────────────
   //  vendorList:            [],
   //  materialList:          [],

   vendorList: [
    { LIFNR: "V001", NAME: "Bosch Ltd",            CITY: "Stuttgart" },
    { LIFNR: "V002", NAME: "Tata Steel",            CITY: "Mumbai" },
    { LIFNR: "V003", NAME: "Siemens AG",            CITY: "Munich" },
    { LIFNR: "V004", NAME: "Mahindra Logistics",    CITY: "Pune" },
    { LIFNR: "V005", NAME: "ABB India",             CITY: "Bengaluru" },
],
materialList: [
    { MATNR: "MAT001", MAKTX: "Brake Disc",      MATKL: "ROH" },
    { MATNR: "MAT002", MAKTX: "Fuel Injector",   MATKL: "ROH" },
    { MATNR: "MAT003", MAKTX: "Spark Plug",      MATKL: "ROH" },
    { MATNR: "MAT004", MAKTX: "Steel Sheet 2mm", MATKL: "ROH" },
    { MATNR: "MAT005", MAKTX: "Bearing 6205",    MAKTL: "ROH" },
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
            EBELP: 10,
            MATNR: "",
            MENGE: null,
            MEINS: "",
            WERKS: "",
            NETPR: null
        }]
    }
};
         const oModel = new JSONModel(oData);
         this.setModel(oModel, "ui");

    }
   });
});
