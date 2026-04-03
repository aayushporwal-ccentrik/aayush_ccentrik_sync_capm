namespace com.project.po;

// managed: Adds createdAt, createdBy, modifiedAt, modifiedBy fields automatically
// cuid: Adds a UUID-based primary key 'ID' automatically
using { managed, cuid } from '@sap/cds/common' ;

/**
 * Purchase Order Header (Parent Entity)
 * This entity stores the high-level details of the order.
 */
entity PurchaseOrder: managed, cuid {

    @title: 'PO Number'
    EBELN : String(10) not null; // SAP standard field for Purchase Order Number

    @title: 'Company Code'
    BUKRS : String(4);

    @title: 'PO Type'
    BSART : String(4);

    @title: 'Vendor'
    @mandatory // Enforces a value check during OData Create/Update
    LIFNR : String(10);

    @title: 'Order Date'
    AEDAT : Date;

    @title: 'Payment Terms'
    ZTERM : String(4);

    @title: 'Total Amount'
    totalAmount : Decimal(13,2);
    
    @title: 'Currency'
    currency : String(3);

    @title: 'Status'
    STATU : String(20) default 'DRAFT';

    /** * COMPOSITION: Defines a parent-child lifecycle.
     * If a PurchaseOrder is deleted, all associated items are deleted automatically.
     * This also enables 'Deep Inserts' (saving Header and Items in one POST request).
     */
    items : Composition of many PurchaseOrderItem on items.up_ = $self;
}

/**
 * Purchase Order Item (Child Entity)
 * Stores the line items for each Purchase Order.
 */
entity PurchaseOrderItem : cuid, managed {

    /**
     * BACK-LINK: Connects the item back to its parent header.
     * In the database, this creates a foreign key column 'up__ID'.
     */
    up_ : Association to PurchaseOrder;

    @title: 'Line Item Number'
    EBELP : Integer; // SAP standard field for Item Number (e.g., 10, 20, 30)

    @title: 'Material Number'
    MATNR : String(40);

    @title: 'Material Description'
    @cds.persistence.skip
    MAKTX_display : String(100);
    
    @title: 'Material Group'
    MATKL : String(9);

    @title: 'Plant'
    WERKS : String(4);

    @title: 'Storage Location'
    LGORT : String(4);

    @title: 'Quantity'
    MENGE : Decimal(13,3);

    @title: 'Unit of Measure'
    MEINS : String(3);

    @title: 'Net Price'
    NETPR : Decimal(13,2);

    @title: 'Price Unit'
    PEINH : Integer;
}

entity NumberRanges {
    key type         : String(20);
        currentValue : Integer default 0;
}