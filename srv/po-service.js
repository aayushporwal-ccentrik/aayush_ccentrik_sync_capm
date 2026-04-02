const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const { PurchaseOrders } = this.entities
    const { NumberRanges } = cds.entities('com.project.po')
    this.before('CREATE', PurchaseOrders, async (req) => {
        try {
            console.log(">>> CREATE handler entered");
            console.log(">>> req.data:", JSON.stringify(req.data));

            // VALIDATION: items required
            if (!req.data.items || req.data.items.length === 0) {
                return req.error(400, 'At least 1 line item is required');
            }

            // VALIDATION: each item must have MATNR and MENGE
            for (const item of req.data.items) {
                if (!item.MATNR || item.MATNR.trim() === '') {
                    req.error(400, `Item ${item.EBELP}: Material (MATNR) is required.`);
                }
                if (!item.MENGE || item.MENGE <= 0) {
                    req.error(400, `Item ${item.EBELP}: Quantity must be greater than 0.`);
                }
            }

            // AUTO-GENERATION: always overwrite EBELN
            let range = await SELECT.one.from(NumberRanges)
                            .where({ type: 'PurchaseOrder' })
                            .forUpdate();

            let nextValue = 1;
            if (range) {
                nextValue = range.currentValue + 1;
                await UPDATE(NumberRanges)
                      .set({ currentValue: nextValue })
                      .where({ type: 'PurchaseOrder' });
            } else {
                await INSERT.into(NumberRanges)
                      .entries({ type: 'PurchaseOrder', currentValue: 1 });
            }

            req.data.EBELN = `PO-${nextValue.toString().padStart(4, '0')}`;
            console.log(">>> Auto-generated EBELN:", req.data.EBELN);

        } catch (err) {
            console.error(">>> CREATE handler FAILED:", err);
            return req.error(500, err.message);
        }
    })

    this.on('submitPO', async (req) => {
        const { poID } = req.data
        return `PO ${poID} submitted successfully`
    })

    this.after('READ', PurchaseOrders, (each) => {
        const elements = Array.isArray(each) ? each : [each]

        elements.sort((a, b) => a.EBELN.localeCompare(b.EBELN))

        elements.forEach(po => {
            if (po.STATU === 'DRAFT') po.STATU = 'Approval Pending'
        })
    })

})