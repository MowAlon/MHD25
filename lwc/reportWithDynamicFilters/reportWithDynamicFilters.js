import { LightningElement, api, track } from 'lwc';
// import { loadStyle } from 'lightning/platformResourceLoader';

export default class ReportWithDynamicFilters extends LightningElement {
    @api title;
    @api description;
    @api iconName;
    @api objectName;
    @api columnsJSON;
    @api filtersCSV;
    @api defaultFilterField;
    @api defaultFilterValue;
    @api defaultSortField;
    @api defaultSortOrder;
    @api picklistInfo;
    @api defaultFilterSelections;
    @api picklistWidth;
    @api keepAllPicklistOptions = false;
    @api inputFilterInfo;
    @api maxRecordCount;
    @api pageSize;
    @api showButtons = false;
    @api hidePagination;

    config;
    queryFilter;

    requiredFilters;
    get requiredFiltersHasData() {return !!this.requiredFilters?.filter(element => element).length;}
    picklistFilters = {};
    inputFilterObjects;
    get inputFilterObjectsHasData() {return !!this.inputFilterObjects?.length;}
    inputFilters;
    fieldInfo;

    inputTypesByRealType = {currency: 'number',
                            date:     'date',
                            datetime: 'date',
                            double:   'number',
                            email:    'text',
                            integer:  'number',
                            long:     'number',
                            phone:    'text',
                            string:   'text',
                            url:      'text'};

    @track picklistData;
    get picklistDataHasData() {return !!this.picklistData?.length;}
    picklistDataByField;
    picklistLabels;
    picklistFields;

    get filtersReady() {return (!this.picklistInfo || this.picklistDataHasData) && (!this.inputFilterInfo || this.inputFilterObjectsHasData);}

    filterButtonActivated = false;
    get filterButtonVariant() {return this.filterButtonActivated ? 'brand' : 'border';}
    initialLoad = true;

    get picklistStyle() {return 'flex-basis:' + this.picklistWidth;}

    skipInitialLoad = true;
    connectedCallback() {
        this.getPicklistLabelsAndFields();
        this.requiredFilters = this.filtersCSV?.split(',').map(filter => filter.trim()) || [];
        this.queryFilter = this.combinedFilters();

        let columnsData = JSON.parse(this.trimSingleQuotes(this.columnsJSON));

        this.config = {objectName: this.objectName,
                       limit: this.maxRecordCount || 10000,
                       pageSize: this.pageSize || !this.hidePagination ? this.pageSize : 10000,
                       hidePagination: this.hidePagination,
                       cacheable: false,
                       defaultSortField: this.defaultSortField,
                       sortAsc: this.defaultSortOrder != 'Descending',
                       extraFieldsToQuery: this.picklistFields,
                       tableConfig: {hideCheckboxColumn: true,
                                     columns: columnsData,
                                     columnWidthsMode: 'auto'}
                    };
    }
        getPicklistLabelsAndFields() {
            if (this.picklistInfo) {
                this.picklistLabels = [];
                this.picklistFields = [];
                this.picklistInfo.split(',').forEach((filterElement, index) => {
                    if (index % 2 == 0) {this.picklistLabels.push(filterElement.trim());}
                    else                {this.picklistFields.push(filterElement.trim());}
                });
            }
        }
        combinedFilters() {
            // picklistFilters is an an Object in which the key is the Field API Name, and the value is the related filter -> {Name: "Name = 'Alon Waisman'", Location__c: "Location__c = 'Denver'"}

            let filterString;

            if (Object.keys(this.picklistFilters).length || !!this.inputFilters || this.requiredFiltersHasData) {
                let allFilters = Object.values(this.picklistFilters);
                console.log('allFilters1', allFilters);
                if (!!this.inputFilters)         {allFilters.push('(' + this.inputFilters.join(' AND ') + ')');}
                console.log('requiredFiltersHasData', this.requiredFiltersHasData);
                console.log('requiredFilters', this.requiredFilters);
                console.log('requiredFilters', this.requiredFilters.length);

                if (this.requiredFiltersHasData) {allFilters.push('(' + this.requiredFilters.join(' AND ') + ')');}
                console.log('allFilters3', allFilters);

                filterString = allFilters.join(' AND ');
            }

            console.log('Required Query Filters: ', this.requiredFilters);
            console.log('Picklist Filters: '      , this.picklistFilters);
            console.log('Input Filters: '         , this.inputFilters);
            console.log('Final SOQL Filter: '     , filterString);

            return filterString;
        }
        trimSingleQuotes(text) {
            return text.at(0) == "'" && text.at(-1) == "'" ? text.substring(1, text.length - 1) : text;
        }

    buildInputFilterObjects() {
        this.inputFilterObjects = [];

        if (this.inputFilterInfo) {
            let inputFilterFields = this.inputFilterInfo.split(',');

            inputFilterFields.forEach(inputFilterField => {
                this.inputFilterObjects = this.inputFilterObjects.concat(this.inputFilterObjectsForOneField(inputFilterField));
            });
        }
    }
            inputFilterObjectsForOneField(fieldDetailsString) {
                // This method builds the information necessary for displaying an input field used to filter by the given field
                // It assumes this.fieldInfo is available and uses that to determine the field's type
                // For strings, a free text input is displayed
                // For dates and numbers, a minimum and maximum input are both displayed

                // Output: {field: field_api_name, type: object_type, label: input label}
                // Examples:
                //      {key: "Name", field: "Name", datatype: "string", label: "Name"}
                //      {key: "CreatedDatemin", field: "CreatedDate", datatype: "date", label: "Earliest Created Date", extreme: "min"}
                //      {key: "CreatedDatemax", field: "CreatedDate", datatype: "date", label: "Latest Created Date", extreme: "max"}

                let filterObjects = [];
                let fieldDetails  = fieldDetailsString.split('::').map(fieldDetail => fieldDetail.trim());
                let field         = fieldDetails[0];
                let fieldInfo     = this.fieldInfo[field];
                let label         = fieldDetails[1] || fieldInfo.label;

                if (fieldInfo) {
                    let inputType = this.inputTypesByRealType[fieldInfo.realType];

                    switch (inputType) {
                        case 'date':
                            filterObjects.push({key: field + "min", field: field, type: inputType, datatype: fieldInfo.realType, label: "Earliest " + label, extreme: "min"});
                            filterObjects.push({key: field + "max", field: field, type: inputType, datatype: fieldInfo.realType, label: "Latest " + label, extreme: "max"});
                            break;
                        case 'number':
                            filterObjects.push({key: field + "min", field: field, type: inputType, datatype: fieldInfo.realType, label: "Lowest " + label, extreme: "min"});
                            filterObjects.push({key: field + "max", field: field, type: inputType, datatype: fieldInfo.realType, label: "Highest " + label, extreme: "max"});
                            break;
                        case 'text':
                            filterObjects.push({key: field, field: field, type: inputType, datatype: fieldInfo.realType, label: label});
                            break;
                      }
                }

                return filterObjects;
            }

    styleApplied = false;
    renderedCallback() {
        if (!this.styleApplied) {this.applyStyle();}
    }
        applyStyle() {
            let style = document.createElement('style')

            style.innerText = '.input-filters .slds-form-element__help{display: none}';
            this.template.querySelector('lightning-card').appendChild(style)
            this.styleApplied = true;
        }

    // USER INTERACTION

    toggleFilters(event) {
        console.log(event);
        this.filterButtonActivated = !this.filterButtonActivated;
        this.template.querySelector('.base-filters').classList.toggle('hide');
    }

    refresh() {
        this.template.querySelector("c-datatable").refreshRecordsOnly();
    }

    handlePicklistSelection(event) {
        this.applyFilter(event.target.dataset.field, event.detail.value)
        this.queryFilter = this.combinedFilters();
    }
        applyFilter(field, value) {
            this.picklistDataByField[field].selection = value;

            if (value) {this.picklistFilters[field] = `${field} = ${this.SOQLvalue(field, value)}`;}
            else       {delete this.picklistFilters[field];}
        }
            SOQLvalue(field, value) {
                return this.fieldInfo[field].type == 'string' ? "'" + value.replaceAll("'", "\\'") + "'" : value;
            }

    handleInputFilters() {
        let inputFilterData = this.inputFilterData();
        this.buildInputFilters(inputFilterData);

        this.queryFilter = this.combinedFilters();
    }
        inputFilterData() {
            // this.inputFilterData should be an array of objects describing each manual input presented to the user

            // For example, the Parent Name and Created Date fields:
            // [{datatype: "string", field: "Parent__r.Name", value: "Some Name"},
            // {datatype: "datetime", extreme: "min", field: "CreatedDate", value: "1979-02-20"},
            // {datatype: "datetime", extreme: "max", field: "CreatedDate", value: "1999-12-31"}]

            let inputElements = this.template.querySelectorAll('.input-filters lightning-input');
            return Array.from(inputElements).map(element => ({...element.dataset, value: element.value}));
        }
        buildInputFilters(inputFilterData) {
            this.inputFilters = null;

            inputFilterData.forEach(filterData => {
                if (filterData.value) {
                    if (!this.inputFilters) {this.inputFilters = [];}

                    switch (this.inputTypesByRealType[filterData.datatype]) {
                        case 'date':
                            let value = filterData.datatype == "datetime" ? filterData.value + "T00:00:00Z" : filterData.value;
                            this.inputFilters.push(`${filterData.field} ${this.extremeOperator(filterData.extreme)} ${value}`);
                            break;
                        case 'number':
                            this.inputFilters.push(`${filterData.field} ${this.extremeOperator(filterData.extreme)} ${filterData.value}`);
                            break;
                        case 'text':
                            this.inputFilters.push(`${filterData.field} LIKE '%${filterData.value}%'`);
                            break;
                      }
                }
            });
        }
            extremeOperator(extreme) {
                return extreme == "min" ? ">=" : "<=";
            }

    handleKeyPress(event) {
        if (event.key == 'Enter') {this.handleInputFilters();}
    }

    // EVENTS FROM DATATABLE

    storeFieldInfo(event) {
        this.fieldInfo = event.detail;
        this.buildInputFilterObjects();
    }

    handleRecords(event) {
        let records = event.detail;
        this.buildPicklistData(records);
        this.applyDefaultPicklistSelections();
    }
        buildPicklistData(records) {
            // The first condition determines whether or not the code should run after every filter action.
            // If it does, the options are reset to reflect only the current set of records.

            if (!this.picklistData || !this.keepAllPicklistOptions) {
                if (this.picklistLabels) {
                    let currentPicklistSelections = this.picklistData?.map(comboBoxData => comboBoxData.selection);

                    this.picklistData     = [];
                    this.picklistDataByField = {};
                    this.picklistLabels.forEach((label, index) => {
                        let field        = this.picklistFields[index];
                        let comboBoxData = this.comboBoxData(label, field, records, currentPicklistSelections, index);

                        this.picklistData.push(comboBoxData);
                        this.picklistDataByField[field] = comboBoxData;
                    });
                }
            }
        }
            comboBoxData(label, field, records, currentPicklistSelections, index) {
                let sortedUniqueValues = [...new Set(records.map(record => record[field]))].filter(uniqueValue => uniqueValue != null && uniqueValue != undefined).sort();
                let options = sortedUniqueValues.map(fieldValue => ({label: fieldValue.toString(), value: fieldValue.toString()}));

                options.unshift({label: 'All', value: ''});

                let currentPicklistSelection = currentPicklistSelections ? currentPicklistSelections[index] : '';
                return {label: label, options: options, placeholder: 'All', field: field, selection: currentPicklistSelection, key: 'Picklist Key ' + index};
            }
        applyDefaultPicklistSelections() {
            if (this.initialLoad && this.defaultFilterSelections) {
                this.setDefaultPicklistSelections();
                this.queryFilter = this.combinedFilters();
            }

            this.initialLoad = false;
        }
            setDefaultPicklistSelections() {
                let elements = this.defaultFilterSelections.split(',');
                for (let i = 0; i < elements.length; i += 2) {
                    let field = elements[i].trim();
                    let value = elements[i + 1].trim();
                    this.applyFilter(field, value);
                }
            }

}