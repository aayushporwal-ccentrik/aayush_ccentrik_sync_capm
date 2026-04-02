sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("aayush.controller.App", {

        onOpenPurchaseOrder() {
            const oApp = this.byId("mainApp");
            const oComponent = this.getOwnerComponent();

            oComponent.runAsOwner(() => {
                const oNavTo = sap.ui.xmlview({
                    viewName: "aayush.view.Purchase"
                });
                oApp.addPage(oNavTo);
                oApp.to(oNavTo.getId());
            });
        }

    });
});