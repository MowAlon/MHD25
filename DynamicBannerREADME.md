# Dynamic Banner
Add a highly customizable banner to any record page

**Features**

* **Styling**: Easily set the appearance of the component, far beyond with the standard Rich Text component supports
  - Directly set the background color, border width and color, font color, text alignment, etc.
  - Apply a component-wide slds class to support consistent Salesforce styling. For example, use slds-theme_warning to make it always look like a Warning regardless of the Salesforce theme you're using.
  - The text inputs (Main Text and Secondary Text) support HTML for more complex styling and layout
* **Banner Links**: The entire banner can act as a button link to a record page (using proper Salesforce navigation) or to any URL
* **Dynamic Content**: Include content from the current record (and related parent records, including through a polymorphic relationship!) by wrapping a field API name in "{{}}"
  - Example from an Opportunity record
    - "This is {{Name}} Opportunity, and it's Account is {{Account.Name}}" would yield something like...
    - "This is Cool Deal Opportunity, and it's Account is Super Cool Account"
    - Use SOQL formatting for parent relationships, like "Parent_Object__r.Custom_Field__c" to reference a custom field on a custom parent object
    - Supports polymorphic relationships, like Tasks linking to stuff - just add the API name of the polymorphically related SObject in parentheses before the field reference. For example "(Case)What.Parent.Custom_Lookup__r.Owner.Name"
  - Note: If you're using an old version of this component where field wrapping looks like \~~FieldAPIName~~, installing this updated version will break your existing implementations. You can either update existing implementations to use the new wrapper formater or manually change the code in dynamicBanner.js where markupL and markupR are defined (also change the metadata where the default value of Main Text is set).
* **Collapsable**: Display a title and hide the rest of the content (and decide if it's collapsed or expanded by default)
* **Double it**: show two banners, oriented horizontally or vertically, each with their own styling

![screenshot](/README_images/DynamicBanner.png)
