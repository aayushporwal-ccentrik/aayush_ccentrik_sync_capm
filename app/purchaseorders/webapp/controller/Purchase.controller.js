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
            const oModel = this.getOwnerComponent().getModel("ui");

            oModel.setProperty("/showOperationSelector", true);
            oModel.setProperty("/showCreatePanel",  false);
            oModel.setProperty("/showReadPanel",    false);
            oModel.setProperty("/showUpdatePanel",  false);
            oModel.setProperty("/showDeletePanel",  false);
            oModel.setProperty("/showDetailPanel",  false);
            oModel.setProperty("/editItemMode",     false);
            oModel.setProperty("/editItemPayload",  {});
            oModel.setProperty("/selectedPO",       {});
            oModel.setProperty("/selectedPOItems",  []);

            // Update search inputs — now two fields: EBELN + EBELP
            oModel.setProperty("/searchEBELN",      "");
            oModel.setProperty("/searchEBELP",      "");

            // Delete panel state
            oModel.setProperty("/deleteEBELN",      "");
            oModel.setProperty("/showDeleteResult",  false);
            oModel.setProperty("/deletePOResults",   []);

            if (!oModel.getProperty("/vendorList"))   oModel.setProperty("/vendorList",   []);
            if (!oModel.getProperty("/materialList")) oModel.setProperty("/materialList", []);
        },

        // ── Helpers ───────────────────────────────────────────────────────────

        _getUiModel: function () {
            return this.getView().getModel("ui");
        },

        // ── F4 Help ───────────────────────────────────────────────────────────

        onVendorF4Help: function () {
            this._openF4Dialog("vendorList", "Select Vendor", "LIFNR", "NAME",
                function (selected) {
                    this._getUiModel().setProperty("/createPayload/LIFNR", selected.LIFNR);
                }.bind(this)
            );
        },

        // FIX: stores both MATNR (for payload) and MAKTX_display (for input field display)
        onMaterialF4Help: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("ui");
            this._openF4Dialog("materialList", "Select Material", "MATNR", "MAKTX",
                function (selected) {
                    const oObj = oContext.getObject();
                    oObj.MATNR         = selected.MATNR;   // actual value sent to backend
                    oObj.MAKTX_display = selected.MAKTX;   // display name shown in the input
                    this._getUiModel().refresh(true);
                }.bind(this)
            );
        },

        _openF4Dialog: function (listPath, title, keyField, labelField, onSelect) {
            const oModel = this._getUiModel();
            const oList = new List({
                mode: "SingleSelectMaster",
                items: {
                    path: "ui>/" + listPath,
                    template: new StandardListItem({
                        title: "{ui>" + labelField + "}",       // shows name
                        description: "{ui>" + keyField + "}"   // shows code below
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
                        if (!oSelected) { MessageBox.warning("Please select an entry."); return; }
                        onSelect(oSelected.getBindingContext("ui").getObject());
                        oDialog.close();
                        oDialog.destroy();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () { oDialog.close(); oDialog.destroy(); }
                })
            });

            oDialog.setModel(oModel, "ui");
            oDialog.open();
        },

        // ── Panel navigation ──────────────────────────────────────────────────

        onSelectCreate: function () { this._toggle("create"); },
        onSelectRead:   function () { this._toggle("read");   this.onLoadData(); },
        onSelectUpdate: function () { this._toggle("update"); },
        onSelectDelete: function () { this._toggle("delete"); },

        _toggle: function (mode) {
            const m = this._getUiModel();
            m.setProperty("/showOperationSelector", false);
            m.setProperty("/showCreatePanel",  mode === "create");
            m.setProperty("/showReadPanel",    mode === "read");
            m.setProperty("/showUpdatePanel",  mode === "update");
            m.setProperty("/showDeletePanel",  mode === "delete");
            m.setProperty("/showDetailPanel",  mode === "detail");
        },

        // onBack — always returns to Operation Selector (no home navigation)
        onBack: function () {
            const m = this._getUiModel();
            m.setProperty("/showOperationSelector", true);
            m.setProperty("/showCreatePanel",  false);
            m.setProperty("/showReadPanel",    false);
            m.setProperty("/showUpdatePanel",  false);
            m.setProperty("/showDeletePanel",  false);
            m.setProperty("/showDetailPanel",  false);
            m.setProperty("/editItemMode",     false);
            m.setProperty("/searchEBELN",      "");
            m.setProperty("/searchEBELP",      "");
            m.setProperty("/showDeleteResult", false);
            m.setProperty("/deletePOResults",  []);
            m.setProperty("/deleteEBELN",      "");
            m.setProperty("/selectedPO",       {});
            m.setProperty("/selectedPOItems",  []);
            this._resetCreatePayload();
        },

        // ── Create ────────────────────────────────────────────────────────────

        onSaveCombined: function () {
            const m = this._getUiModel();
            const payload = m.getProperty("/createPayload");
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
            items.push({
                EBELP: (items.length + 1) * 10,
                MATNR: "", MAKTX_display: "", MENGE: null, MEINS: "", WERKS: "", NETPR: null
            });
            m.setProperty("/createPayload/items", items);
        },

        // ── Read ──────────────────────────────────────────────────────────────

        onLoadData: function () {
            const m = this._getUiModel();
            callOData("/PurchaseOrders", "GET", null)
                .then(data => m.setProperty("/POHeader", data || []))
                .catch(err => MessageBox.error("Failed to load POs: " + err.message));
        },

        onPORowSelect: function (oEvent) {
            const oRow = oEvent.getParameter("rowContext");
            if (!oRow) return;

            const m = this._getUiModel();
            const oPO = oRow.getObject();
            m.setProperty("/selectedPO", oPO);

            callOData("/PurchaseOrderItems?$filter=up__ID eq '" + oPO.ID + "'", "GET", null)
                .then(data => m.setProperty("/selectedPOItems", data || []))
                .catch(err => MessageBox.error("Failed to load items: " + err.message));

            this._toggle("detail");
        },

        // ── Update — search by EBELN + EBELP (both required) ─────────────────

        onSearchItem: function () {
            const m = this._getUiModel();
            const ebeln = (m.getProperty("/searchEBELN") || "").trim();
            const ebelp = (m.getProperty("/searchEBELP") || "").trim();

            if (!ebeln) { MessageBox.warning("Please enter the PO Number (EBELN)."); return; }
            if (!ebelp) { MessageBox.warning("Please enter the Item Number (EBELP)."); return; }

            // CAP uses UUID as the OData key — we must filter by business fields
            // EBELP in CAP is stored as Integer — cast it
            const eBelpInt = parseInt(ebelp, 10);
            if (isNaN(eBelpInt)) { MessageBox.warning("Item Number must be a number (e.g. 10, 20)."); return; }

            // Filter by both parent PO EBELN and item EBELP
            const filter = "EBELP eq " + eBelpInt + " and up_/EBELN eq '" + ebeln + "'";

            callOData("/PurchaseOrderItems?$filter=" + encodeURIComponent(filter), "GET", null)
                .then(data => {
                    if (!data || data.length === 0) {
                        MessageBox.warning("No item found for PO " + ebeln + " Item " + ebelp + ".");
                        return;
                    }
                    const item = data[0];
                    // Flatten EBELN into payload for display (it lives on the parent)
                    item.EBELN = ebeln;
                    m.setProperty("/editItemPayload", item);
                    m.setProperty("/editItemMode", true);
                })
                .catch(err => MessageBox.error("Search failed: " + err.message));
        },

        onUpdateItem: function () {
            const m = this._getUiModel();
            const data = m.getProperty("/editItemPayload");

            if (!data || !data.ID) {
                MessageBox.warning("No item loaded. Please search first.");
                return;
            }

            // Use UUID (data.ID) — the correct CAP OData key
            callOData("/PurchaseOrderItems(" + data.ID + ")", "PATCH", { MENGE: Number(data.MENGE) })
                .then(() => {
                    MessageBox.success("Quantity updated successfully for Item " + data.EBELP + ".");
                    m.setProperty("/editItemMode",    false);
                    m.setProperty("/searchEBELN",     "");
                    m.setProperty("/searchEBELP",     "");
                    m.setProperty("/editItemPayload", {});
                })
                .catch(err => MessageBox.error("Update failed: " + err.message));
        },

        // ── Delete — search by EBELN, then select rows ────────────────────────

        onDeleteSearch: function () {
            const m = this._getUiModel();
            const ebeln = (m.getProperty("/deleteEBELN") || "").trim();

            let url = "/PurchaseOrders";
            if (ebeln) {
                url = "/PurchaseOrders?$filter=contains(EBELN,'" + ebeln + "')";
            }

            callOData(url, "GET", null)
                .then(data => {
                    m.setProperty("/deletePOResults",  data || []);
                    m.setProperty("/showDeleteResult", true);
                })
                .catch(err => MessageBox.error("Search failed: " + err.message));
        },

        onDeleteSelected: function () {
            const oTable = this.byId("idDeletePOTable");
            const indices = oTable.getSelectedIndices();

            if (indices.length === 0) {
                MessageBox.warning("Please select at least one PO to delete.");
                return;
            }

            const m = this._getUiModel();
            const rows = m.getProperty("/deletePOResults");

            MessageBox.confirm(
                "Delete " + indices.length + " selected Purchase Order(s)? This cannot be undone.",
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: (sAction) => {
                        if (sAction !== MessageBox.Action.YES) return;

                        const promises = indices.map(i =>
                            callOData("/PurchaseOrders(" + rows[i].ID + ")", "DELETE", null)
                        );

                        Promise.all(promises)
                            .then(() => {
                                MessageBox.success("Selected PO(s) deleted successfully.");
                                m.setProperty("/showDeleteResult", false);
                                m.setProperty("/deletePOResults",  []);
                                m.setProperty("/deleteEBELN",      "");
                            })
                            .catch(err => MessageBox.error("Delete failed: " + err.message));
                    }
                }
            );
        },

        // ── Utilities ─────────────────────────────────────────────────────────

        _resetCreatePayload: function () {
            this._getUiModel().setProperty("/createPayload", {
                EBELN: "", BUKRS: "", BSART: "", LIFNR: "",
                AEDAT: "", ZTERM: "", currency: "",
                items: [{
                    EBELP: 10, MATNR: "", MAKTX_display: "",
                    MENGE: null, MEINS: "", WERKS: "", NETPR: null
                }]
            });
        }

    });
});