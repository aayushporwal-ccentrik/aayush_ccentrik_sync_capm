// const cds = require('@sap/cds')

// module.exports = cds.service.impl(async function() {

//     //Initializing PurchaseOrders and Number Ranges
//     const { PurchaseOrders, NumberRanges } = this.entities 

//     //     this.before('SAVE', PurchaseOrders, async (req) => {

//     //     // 1. Validation
//     //     if (!req.data.items || req.data.items.length === 0) {
//     //         return req.error(400, 'At least 1 line item is required')
//     //     }

//     //     // 2. Skip if number already exists (Prevent overwrite on Edit)
//     //     if (req.data.EBELN) {
//     //         console.log('>>> PO has already a number skipping generation')
//     //      }
//     // }) 


// this.before('CREATE', PurchaseOrders, async (req) => {
//     try {
//         console.log(">>> CREATE handler entered");
//         console.log(">>> req.data:", JSON.stringify(req.data));

//         // Validation
//         if (!req.data.items || req.data.items.length === 0) {
//             return req.error(400, 'At least 1 line item is required');
//         }

//         // Number range generation
//         let range = await SELECT.one.from(NumberRanges)
//                         .where({ type: 'PurchaseOrder' })
//                         .forUpdate();
        
//         let nextValue = 1;
//         if (range) {
//             nextValue = range.currentValue + 1;
//             await UPDATE(NumberRanges)
//                   .set({ currentValue: nextValue })
//                   .where({ type: 'PurchaseOrder' });
//         } else {
//             await INSERT.into(NumberRanges)
//                   .entries({ type: 'PurchaseOrder', currentValue: 1 });
//         }

//         req.data.EBELN = `PO-${nextValue.toString().padStart(4, '0')}`;
//         console.log(">>> Assigned EBELN:", req.data.EBELN);

//     } catch (err) {
//         console.error(">>> CREATE handler FAILED:", err);
//         return req.error(500, err.message);
//     }
//     }) 



//     this.on('submitPO', async (req) => {
//         const { poID } = req.data
//         return `PO ${ poID } submitted successfully`
//     })

//     this.after('READ', PurchaseOrders, (each) => {
//         const elements = Array.isArray(each) ? each : [each]
//         elements.forEach(po => {
//             if (po.status === 'DRAFT') po.status = 'Approval Pending'
//         })
//     })
// })

