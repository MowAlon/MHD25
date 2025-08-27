# Report with Dynamic Filters

This is a powerful tool that can help you (and your users who love quick, interactive reporting) find specific records or collections of records based on your specific needs. It's not perfect, but it's pretty awesome.

![screenshot](/README_images/ReportWithDynamicFilters.png)

<br>

> Note: In this document, I refer to "SOQL-format" because I don't know what else to call it. I'm referring to the special, cross-object dot-notation that Salesforce uses in which we convert the "__c" of a custom reference field to "__r" to refer to the related object and then use dots to separate the objects from their fields... like "Custom_Relationship__r.Another_Custom_Relationship__r.Custom_Field__c" or "StandardLookup.StandardField" or "Custom_Relationship__r.StandardLookup.Custom_Field__c"

<hr>

**_Report with Dynamic Filters_**
![Report with Dynamic Filters](/README_images/ReportWithDynamicFilters.png)

<hr>

**_Lightning App Builder inputs_**  
![Lightning App Builder inputs](/README_images/ReportWithDynamicFilters_lightning_app_builder_inputs.png)

<hr>

## Instructions

### <ins>Title</ins>
Set the title to whatever you want.
<br><br>

### <ins>Icon Name</ins>
Add an icon to the title by referencing both the icon category and name with the format "category:icon". See the [Lightning Design System icon library](https://www.lightningdesignsystem.com/2e1ef8501/p/83309d-iconography/b/586464) for details.
<br><br>

### <ins>Description</ins>
An optional line of text you can add to instruct users.
<br><br>

### <ins>Object API Name</ins>
This is the API name of the Salesforce Object you want to display. All references to fields in other inputs are from the perspective of this object. For example, if you want to the display Cases with their Case Numbers and related Account names, you would reference the Case Numbers simply by the API Name of the field (CaseNumber) since Case Number is a field on this object. Meanwhile, you would use "Account.Name" (same as a SOQL query), because that is how you find the name of the Account when querying the Case object.
<br><br>

### <ins>Columns Data (JSON)</ins>
This one's tough. It really had to be JSON. The options available are based on the custom "Datatable" Lighting Web Component included in this package. I'm not going to spell them all out here, but I'll use some example JSON to explain the important stuff.

```
[
    {
        "sortable": true,                  // true/false: Determines whether or not the user can click on the table heading to sort the table
        "hideDefaultActions": true,        // true/false: The only default actions on the I've ever seen allow the user to elect to wrap content (default is true)
        "api": "Id",                       // text:       The API Name of the field you want to display
        "label": "Case Number",            // text:       This masks the header - instead of using the standard field label, you can customize it
        "linkToRecord": true,              // true/false: If the field is a reference field and you want to link to that record, make this true
        "type": "url",                     // text:       Used in conjunction with linkToRecord option - if you want to link to the record, set this to "url"
        "typeAttributes": {                // object:     Used in conjunction with the other fields that allow you to display links
            "label": {
                "fieldName": "CaseNumber"  // text:       API Name of the field that should be used to mask the record ID - protip, it can be from a related object
            },
            "target": "_blank"             // text:       Determines if the link opens in the current tab or a new one - use "self" for the current tab and "_blank" for a new tab
        }
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "api": "Center__c",
        "linkToRecord": true,
        "type": "url",
        "typeAttributes": {
            "label": {
                "fieldName": "Center__r.Name"
            },
            "target": "_blank"
        }
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "api": "ContactId",
        "linkToRecord": true,
        "type": "url",
        "typeAttributes": {
            "label": {
                "fieldName": "Contact.Name"
            },
            "target": "_blank"
        }
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "wrapText": false,            // true/false: Sets the wrapping value when you want to force it
        "api": "Category__c"
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "wrapText": true,
        "api": "Subcategory__c",
        "initialWidth": 200           // number: manually set the initial pixel width of the column
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "api": "Status",
        "initialWidth": 150
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "wrapText": false,
        "api": "Case_Details__r.Incident_Date__c",
        "initialWidth": 120
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "wrapText": false,
        "api": "Receipt_Date_Unified__c",
        "label": "Receipt Date",
        "initialWidth": 120
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "api": "Due_Date__c",
        "label": "Due Date",
        "initialWidth": 120
    },
    {
        "sortable": true,
        "hideDefaultActions": true,
        "api": "Owner.Name",
        "label": "Owner"
    }
]
```
<br><br>

### <ins>Relationship to Parent Record from Related List Records</ins>
This is the full SOQL-format relationship to the "parent" record. In our screenshot example, this is "Opportunity.AccountId" which is how you relate the OpportunityLineItem object to the Account object.

Again, normally, the parent record is the record of the current page, but it could be something else if you used the optional input above to change the parent record.
<br><br>

### <ins>Column Info</ins>
A comma-separated list of the fields to display.

Fields in this section ARE case-sensitive so be sure you're exact. For example, use "Id" rather than "ID".

Supports related fields using SOQL-format.

The fields are assigned from the perspective of the related records' object. In the screenshot example above, where "OpportunityLineItem" is the object being displayed, this means the "Name" field is an Opportunity Line Item's name. The related Opportunity's name would be "Opportunity.Name". The name of a custom relationship would be something like "Custom_Relationship__r.Name".

Each field has up to three parts, separated by double-colons "::". Extra spacing around the colons and comma-separation is supported.

The simple explanation of these parts is that, in many situations, you just need the first one. If you want to customize the column header, you can by adding the second part. If the field is a reference field (a lookup or master-detail field) and you want it to hyperlink to the related record, you must use all three parts.

Detailed explanation of all three parts:
1. **SOQL-formatted API name of the field**
    * Examples: "Id", "Name", "Custom_Field__c", or "Parent__r.Grandparent__r.Interesting_Field_on_Grandparent__c"
    * If the field is a reference field (a lookup or master-detail), it _can_ automatically link to the referenced record. For example, the classic record name that links to the record. For a reference field to automatically link to the referenced record, you must provide the second and third parts of the column info.
2. **Custom column header (optional)**
    * If you only provide the first part, the the field's existing label will be used, but this allows you to customize it.
    * If it's a reference field and you want to use the field's existing label, indicate this with a double-asterisk "**". If you like the existing label, it's best to choose this option because it means future changes to the label would automatically reflect in this component.
3. **Id Mask (only used with reference fields)**
    * Allows you to replace the Id value with something else, like the referenced record's Name. When used, the content will hyperlink to referenced record.
    * Common example: "Name" when using the record's Id field, so the record's Name is displayed instead of the actual Id value.

**A complex example of Column Info**  
This is the full column info used in the screenshots above:  
`Id :: Product :: Product2.Name, OpportunityId :: Opportunity :: Opportunity.Name, Quantity, CreatedDate :: Date Added, UnitPrice, TotalPrice`

For demonstration, focus on the "Product" column, which lists the Product's name and links to the related Product record.

`Id :: Product :: Product2.Name`  

**Part 1, <ins>Id</ins>:**  
The intent is to link to the Opportunity Line Item records, and that's the base object for the records in the table, so the "Id" field is used.

**Part 2, <ins>Product</ins>**:  
A custom header. If one wasn't used, the default field label of "Line Item ID" would be used, and the actual Id value would be shown in the table. The intent, however, is to mask the Id with the Product's Name, so "Product" is used, but it could be anything - even emoji 🤌🤖.

**Part 3, <ins>Product2.Name</ins>**:  
To mask the Id value with the Product's name, "Product2.Name" is used because that's the reference to the Product's Name field from the base object, Opportunity Line Item.
<br><br>

### <ins>Filters (CSV, can use $recordId)</ins>
Comma-separated list of filter conditions that will always be active.

These should be in SOQL-format - meaning, however you would write them if they were part of a SOQL query, like "Date = THIS_YEAR" or "Name LIKE '%Cool Name%'"

Use '$recordId' to reference the parent record's Id value. Assuming you keep 'Limit results to this record's relations' checked, results are automatically filtered to only include those with a relationship to the parent record.
<br><br>

### <ins>Initial Sort Field</ins>
The column to be used for initial sorting.

This must be a column that is displayed (for example, you can't sort by LastModifiedDate unless you're showing that field).

If the sorted column is a reference field, sorting is based on the mask, but you still use reference field's API name.  
In the example screenshot, "Product2Id", is the sort field, but the actual sorting is based on the Product's Name because that's the mask being used for the column.
<br><br>

### <ins>Initial Sort Order</ins>
Choose from Ascending or Descending.
<br><br>

### <ins>Page Size</ins>
Pagination is on by default. This is the number of records displayed per page unless you turn off pagination.
<br><br>

### <ins>Show Row Numbers</ins>
Uncheck this if you don't want to display row numbers.
<br><br>

### <ins>No Pagination</ins>
If you really don't expect there to ever be a very large number of records, check this to always show all records and hide the pagination content at the bottom.
<br><br>

### <ins>Limit results to Parent Record's relations</ins>
On by default which means results are filtered so only records with a relationship to the parent record are included. In other words, this filter is active: "<relationship field> = $recordId". In rare situations, it may be useful not to include this filter and manually apply something similar.
