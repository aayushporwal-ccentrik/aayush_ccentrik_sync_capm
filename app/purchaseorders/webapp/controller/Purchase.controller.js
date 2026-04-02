sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Button"
], function (Controller, JSONModel, MessageBox, Dialog, List, StandardListItem, Button) {

    "use strict";

    const BASE_URL = "/po";

    async function callOData(path, method, body) {
        const options = {
            method: method,
            headers: { "Content-Type": "application/json" }
        };
        if (body && method !== "GET") {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(BASE_URL + path, options);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }
        if (response.status === 204) return null;
        const json = await response.json();
        return json.value !== undefined ? json.value : json;
    }

    return Controller.extend("aayush.controller.Purchase", {

        onInit: function () {
            // 1. Get the model we already defined in Component.js
            const oModel = this.getOwnerComponent().getModel("ui");
            
            // 2. Add/Update the navigation states to the EXISTING model 
            oModel.setProperty("/showOperationSelector", true);
            oModel.setProperty("/showCreatePanel", false);
            oModel.setProperty("/showReadPanel", false);
            oModel.setProperty("/showUpdatePanel", false);
            oModel.setProperty("/searchItemId", "");
            oModel.setProperty("/editItemMode", false);
            oModel.setProperty("/editItemPayload", {});
            oModel.setProperty("/showDetailPanel", false);
            oModel.setProperty("/selectedPO", {});
            oModel.setProperty("/selectedPOItems", []);

            // Ensure F4 lists are initialized if not in Component.js
            if (!oModel.getProperty("/vendorList")) oModel.setProperty("/vendorList", []);
            if (!oModel.getProperty("/materialList")) oModel.setProperty("/materialList", []);
        },

        // Helper to get the correct model throughout the controller
        _getUiModel: function() {
            return this.getView().getModel("ui");
        },

        _loadVendors: function () {
            callOData("/Vendors", "GET", null)
                .then(data => {
                    this._getUiModel().setProperty("/vendorList", data || []);
                })
                .catch(() => console.warn("Vendor list could not be loaded"));
        },

        _loadMaterials: function () {
            callOData("/Materials", "GET", null)
                .then(data => {
                    this._getUiModel().setProperty("/materialList", data || []);
                })
                .catch(() => console.warn("Material list could not be loaded"));
        },

        // 
        
        //— match exact field names from Component.js
onVendorF4Help: function () {
    this._openF4Dialog("vendorList", "Select Vendor", "LIFNR", "NAME",
        function (selected) {
            this._getUiModel().setProperty("/createPayload/LIFNR", selected.LIFNR);
        }.bind(this)
    );
},

onMaterialF4Help: function (oEvent) {
    const oContext = oEvent.getSource().getBindingContext("ui");
    this._openF4Dialog("materialList", "Select Material", "MATNR", "MAKTX",
        function (selected) {
            const oObj = oContext.getObject();
            oObj.MATNR = selected.MATNR;
            this._getUiModel().refresh(true);
        }.bind(this)
    );
},

        _openF4Dialog: function (listPath, title, keyField, labelField, onSelect) {
            const oModel = this._getUiModel();
            const oList = new List({
                mode: "SingleSelectMaster",
                items: {
                    path: "ui>/" + listPath, // Use named model prefix
                    template: new StandardListItem({
                        title: "{ui>" + labelField + "}",
                        description: "{ui>" + keyField + "}"
                    })
                }
            });

            const oDialog = new Dialog({
                title: title,
                content: [oList],
                beginButton: new Button({
                    text: "Select",
                    type: "Emphasized",
                    press: function () {
                        const oSelected = oList.getSelectedItem();
                        if (!oSelected) {
                            MessageBox.warning("Please select an entry.");
                            return;
                        }
                        onSelect(oSelected.getBindingContext("ui").getObject());
                        oDialog.close();
                        oDialog.destroy();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                        oDialog.destroy();
                    }
                })
            });

            oDialog.setModel(oModel, "ui");
            oDialog.open();
        },

        onSelectCreate: function () { this._toggle("create"); },
        onSelectRead:   function () { this._toggle("read");   this.onLoadData(); },
        onSelectUpdate: function () { this._toggle("update"); },

        _toggle: function (mode) {
            const m = this._getUiModel();
            m.setProperty("/showOperationSelector", false);
            m.setProperty("/showCreatePanel",  mode === "create");
            m.setProperty("/showReadPanel",    mode === "read");
            m.setProperty("/showUpdatePanel",  mode === "update");
            m.setProperty("/showDetailPanel", mode === "detail");
        },

        onBack: function () {
            const m = this._getUiModel();
            m.setProperty("/showOperationSelector", true);
            m.setProperty("/showCreatePanel",  false);
            m.setProperty("/showReadPanel",    false);
            m.setProperty("/showUpdatePanel",  false);
            m.setProperty("/editItemMode",     false);
            // CHANGE: reset detail panel
            m.setProperty("/showDetailPanel", false);
            m.setProperty("/selectedPO", {});
            m.setProperty("/selectedPOItems", []);
            this._resetCreatePayload();
        },

        onSaveCombined: function () {
            const m = this._getUiModel();
            const payload = m.getProperty("/createPayload");

            // if (!payload.LIFNR || !payload.AEDAT) {
            //     MessageBox.error("Vendor and Order Date are required.");
            //     return;
            // }

            payload.items = payload.items.filter(i => i.MATNR && i.MATNR.trim() !== "");

            callOData("/PurchaseOrders", "POST", payload)
                .then(() => {
                    MessageBox.success("Purchase Order created successfully.");
                    this.onBack();
                })
                .catch(err => MessageBox.error("Create failed: " + err.message));
        },

        onAddItem: function () {
            const m = this._getUiModel();
            const items = m.getProperty("/createPayload/items");
            const nextEBELP = (items.length + 1) * 10;

            items.push({
                EBELP: nextEBELP,
                MATNR: "",
                MENGE: null,
                MEINS: "",
                WERKS: "",
                NETPR: null
            });
            m.setProperty("/createPayload/items", items);
        },


        onLoadData: function () {
    const m = this._getUiModel();
    callOData("/PurchaseOrders", "GET", null)
        .then(data => {
            console.log(">>> POHeader received:", JSON.stringify(data));
            m.setProperty("/POHeader", data || []);
            console.log(">>> POHeader in model:", JSON.stringify(m.getProperty("/POHeader")));
        })
        .catch(err => MessageBox.error("Failed to load POs: " + err.message));

    callOData("/PurchaseOrderItems", "GET", null)
        .then(data => {
            console.log(">>> POItems received:", JSON.stringify(data));
            m.setProperty("/POItems", data || []);
        })
        .catch(err => MessageBox.error("Failed to load PO Items: " + err.message));
},

// NEW: row select handler — loads header + items into detail panel
onPORowSelect: function (oEvent) {
    const oRow = oEvent.getParameter("rowContext");
    if (!oRow) return;

    const m = this._getUiModel();
    const oPO = oRow.getObject();         // full PO object from ui>/POHeader
    console.log(">>> Selected PO:", JSON.stringify(oPO));
    m.setProperty("/selectedPO", oPO);

    // Auto-load items filtered by parent UUID
    callOData("/PurchaseOrderItems?$filter=up__ID eq '" + oPO.ID + "'", "GET", null)
        .then(data => {
                console.log(">>> Items for PO:", JSON.stringify(data)); 
                m.setProperty("/selectedPOItems", data || [])
})
        .catch(err => MessageBox.error("Failed to load items: " + err.message));

    this._toggle("detail");
},

// NEW: inline quantity update — reads MENGE from the binding context of the pressed button
onUpdateItemInline: function (oEvent) {
    const oContext = oEvent.getSource().getBindingContext("ui");
    const oItem = oContext.getObject();

    callOData("/PurchaseOrderItems(" + oItem.ID + ")", "PATCH", { MENGE: Number(oItem.MENGE) })
        .then(() => MessageBox.success("Item " + oItem.EBELP + " updated."))
        .catch(err => MessageBox.error("Update failed: " + err.message));
},

// NEW: delete PO with confirmation dialog
onDeletePO: function () {
    const m = this._getUiModel();
    const oPO = m.getProperty("/selectedPO");

    MessageBox.confirm("Delete PO " + oPO.EBELN + "? This cannot be undone.", {
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        onClose: (sAction) => {
            if (sAction !== MessageBox.Action.YES) return;
            callOData("/PurchaseOrders(" + oPO.ID + ")", "DELETE", null)
                .then(() => {
                    MessageBox.success("PO " + oPO.EBELN + " deleted.");
                    this.onBack();
                    this.onLoadData();   // refresh the read list
                })
                .catch(err => MessageBox.error("Delete failed: " + err.message));
        }
    });
},

        onSearchItem: function () {
            const m = this._getUiModel();
            const ebelp = m.getProperty("/searchItemId");

            if (!ebelp) {
                MessageBox.warning("Please enter an Item Number.");
                return;
            }

            callOData("/PurchaseOrderItems(" + ebelp + ")", "GET", null)
                .then(data => {
                    m.setProperty("/editItemPayload", data);
                    m.setProperty("/editItemMode", true);
                })
                .catch(() => MessageBox.error("Item not found."));
        },

         

        onUpdateItem: function () {
            const m = this._getUiModel();
            const data = m.getProperty("/editItemPayload");

            callOData("/PurchaseOrderItems(" + data.EBELP + ")", "PATCH", {
                MENGE: data.MENGE
            })
                .then(() => {
                    MessageBox.success("Item updated successfully.");
                    this.onBack();
                })
                .catch(err => MessageBox.error("Update failed: " + err.message));
        },

        _resetCreatePayload: function () {
            this._getUiModel().setProperty("/createPayload", {
                EBELN: "", BUKRS: "", BSART: "", LIFNR: "", AEDAT: "", ZTERM: "", currency: "",
                items: [{ EBELP: 10, MATNR: "", MENGE: null, MEINS: "", WERKS: "", NETPR: null }]
            });
        }
    });
});