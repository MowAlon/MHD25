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
This is the API name of the Salesforce Object you want to display.
All references to fields in other inputs are from the perspective of this object. For example, if you want to the display Cases with their Case Numbers and related Account names, you would reference the Case Numbers simply by the API Name of the field (CaseNumber) since Case Number is a field on this object. Meanwhile, you would use "Account.Name" (same as a SOQL query), because that is how you find the name of the Account when querying the Case object.
<br><br>

### <ins>Columns Data (JSON)</ins>
This one's tough. It really had to be JSON.
The options available are based on the custom "Datatable" Lighting Web Component included in this package. I'm not going to spell them all out here, but I'll use some example JSON to explain the important stuff.

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

### <ins>Required Filters (CSV)</ins>
A comma separated list of filters that will ALWAYS be applied to the query.
If you have one or more, there will be a button displayed so users can see the filters you applied.
Write the filters just as you'd write them in a SOQL query. For example, Status = 'Problem' or Related_Object__r.Owner.Name = 'Alon Waisman'.
When you use multiple filters, they're all applied together, like if you used an "AND" between them all in a query.
<br><br>

### <ins>Initial Sort Field</ins>
Gives you the option to sort the table by a specific column when it first displays.
If the field you want to sort by is a reference field, like the record's ID field, use that underlying field as the sort field - not the field that is used to Mask the data. It WILL sort by the content you see in the column.
For example, if I'm linking to the record ID but masking it with the record's Name, I use "Id" as the sort field, but sorting is actually based on the record's Name.
<br><br>

### <ins>Initial Sort Order</ins>
Simple: Ascending or Descending
<br><br>

### <ins>Picklist Filter Details</ins>
This is what constructs the selectable picklists filters.
To be clear, the fields used do NOT need to be a picklist fields - picklists will generate from all the values it found in the initial search. So, you COULD put Account Name in here and show a selectable list of all Account Names, though I don't know that it's a great idea when used with a field that is probably unique across all records.
With this in mind, it's important to mention that not all field types are compatible - you have to be able to filter on it in a SOQL query, so things like Long Text are out.

The format for entering this info is a bit weird (I'll probably change some day). It's a comma-separated list that alternates between the label to be used on the picklist and the API Name of the field where the values will be found.

For example, if you want to have filters for Case Status and the related Contact's Mailing States, you might use "Case Status, Status, State, Contact.MailingState".
<br><br>

### <ins>Default Picklist Selections (CSV, alternating)</ins>
Allows you to preset some of the picklist filters.
Also uses the alternating, comma-separated values. The first value is the API Name of the picklist field from the above setting. The second value is the default you want to use (don't use quotes around a string value).

For example, if you want to default to only showing open Cases in the "Problem" Category, you'd use "Category__c, Problem, IsClosed, false".
<br><br>

### <ins>Picklist Width</ins>
Allows you to set the width of the picklists boxes.
All will be the same size when you use this option.
Accepts any CSS-style sizing (px, em, vw, etc), so not just pixels, but if you do want pixel width, include the "px".
<br><br>

### <ins>Keep Picklist Options AFter Filtering?</ins>
Determines how the list of selections in the picklists behave after filtering has been applied.
If you check this box, then whatever options were found in the initial search remain in the list even if it means applying one of those filters would result in zero found records.
If you do not check the box, every time a filter is applied, the list of selectable options is limited to what's available in the current list of found records.
<br><br>

### <ins>Free input filter fields (CSV)</ins>
Allows you to provide additional filters that are more freeform.
It's great if you're displaying something with lots of unique text fields and want the user to be able to type what they want to find the record.
For Strings, this is a fuzzy search, so it's not case-sensitive, and you can use partial text, like "man" to find "Alon Waisman" in a search of all users.
It supports Dates and Numbers as well. For these, two filters will be displayed so you can pick the minimum and maximum values.

This is a comma-separated list of the API Names of the field you want. By default, the field's standard label is used, but you can use a custom label by add a double-colon and the custom label you want.
For example, if you want to be able to search Contact Names and the Accounts' Annual Revenues but you call Contacts "Customers", use "Contact.Name :: Customer, Account.AnnualRevenue".

Fields in this section ARE case-sensitive so be sure you're exact. For example, use "Id" rather than "ID".

Supports related fields using SOQL-format.

The fields are assigned from the perspective of the related records' object. In the screenshot example above, where "OpportunityLineItem" is the object being displayed, this means the "Name" field is an Opportunity Line Item's name. The related Opportunity's name would be "Opportunity.Name". The name of a custom relationship would be something like "Custom_Relationship__r.Name".

For Dates and Numbers, whatever standard or custom label is being used will be automatically preceded by "Earliest" & "Latest" for Dates and "Lowest" & "Highest" for Numbers.
<br><br>

### <ins>Max Records</ins>
Default and max is 10K, but you can apply a tighter limit.
With 10K records, there's a reasonable chance you'll break it because Lightning Web Components can only handle so much data.
So, if you're trying to filter an object with absolute heaps of records, you'll have to come up with one or more reasonable Required Filters (setting above). For instance, only showing records created recently.
Also, a warning will display if the number of found records exceeds the applied limit. This is intended as a warning to users that they are missing some records.
<br><br>

### <ins>Max Records</ins>
The number of records displayed in a single page.
Pagination is not mandatory, but applying a value to this setting would be dangerous if you're not paginating because you'll only see as the number assigned and have no way to see the rest.
<br><br>

### <ins>Show Buttons</ins>
Used to display the action buttons used for displaying the Required Filters and refreshing the search.
Note that the filter button won't display if there are no Required Filters.
<br><br>

### <ins>No Pagination</ins>
Allows you to hide the default pagination.
