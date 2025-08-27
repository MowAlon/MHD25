import { LightningElement, api }    from 'lwc';
import { registerRefreshContainer } from "lightning/refresh";
import { NavigationMixin }          from 'lightning/navigation';
import getRecords                   from '@salesforce/apex/LWC_Utilities.safe_records_uncached';
import { popToast }                 from 'c/utilities';

export default class DynamicBanner extends NavigationMixin(LightningElement) {
    @api objectApiName;
    @api recordId;

    @api boxShadow   = false;
    @api collapsable = false; // Setting these values here only impacts the Lightning Page Builder - NOT setting them would make it appear as collapsable and collapsed when the builder loads, even if those aren't the selected options.
    @api collapse    = false;
    @api direction;
    get doCollapse() {return this.collapsable && this.collapse;}

    @api title1;
    @api text1;
    @api bannerLink1;
    @api linkType1;
    @api linkNewTab1 = false;
    @api bold1       = false;
    @api border1     = false;
    @api classes1;
    @api background1;
    @api borderColor1;
    @api borderWidth1;
    @api fontColor1;
    @api fontSize1;
    @api alignment1;

    @api title2;
    @api text2;
    @api bannerLink2;
    @api linkType2;
    @api linkNewTab2 = false;
    @api bold2       = false;
    @api border2     = false;
    @api classes2;
    @api background2;
    @api borderColor2;
    @api borderWidth2;
    @api fontColor2;
    @api fontSize2;
    @api alignment2;

    translatedTitle1
    translatedText1
    translatedBannerLink1
    translatedTitle2
    translatedText2
    translatedBannerLink2
    translatedVisibilityFilters

    @api visibilityFilters;
    @api visibilityLogic;
    visibilityFilterObjects;

    fieldData = {};
    recordData;

    get isLink1() { return !!this.bannerLink1; }
    get isLink2() { return !!this.bannerLink2; }
    get hide()    { return !this.inAppBuilder && (this.isLoading || !this.visible); }

    markupL = '{{';
    markupR = '}}';
    markupRegex = this.markupL + '.+' + this.markupR;

    isLoading = true;
    mainStyle;
    allClasses1;
    allClasses2;
    style1;
    style2;
    visible;

    get inAppBuilder() { return window.location.href.includes('/flexipageEditor/surface.app'); }

    connectedCallback() {
        registerRefreshContainer(this, this.refreshContainer);
        this.setStyles();
        this.buildDataObjects();
    }
    async buildDataObjects() {
        this.isLoading = true;
        this.buildVisibilityFilterObjects();
        this.buildFieldData();

        try {
            if (this.fieldData.allFields.size) {
                let data = await this.getRecordData();

                if (data) {this.recordData = data[0];}
            }

            this.translateText();
            this.setVisibility();
        }
        catch (error) {
            this.isLoading = false;
            popToast(this, 'error', error, 'Dynamic Banner');
        }

        this.isLoading = false;
    }

    setStyles() {
        let mainClasses = 'slds-card banner';
        this.allClasses1 = mainClasses + (this.classes1 ? ' ' + this.classes1.trim() : '') + (this.bannerLink1 ? ' link ' : '') + ' align-' + this.alignment1;
        this.allClasses2 = mainClasses + (this.classes2 ? ' ' + this.classes2.trim() : '') + (this.bannerLink2 ? ' link ' : '') + ' align-' + this.alignment2;

        this.mainStyle = 'flex-direction:' + this.direction;
        this.style1    = this.style(this.title1, this.text1, this.background1, this.bold1, this.border1, this.borderColor1, this.borderWidth1, this.fontColor1, this.fontSize1, this.alignment1);
        this.style2    = this.style(this.title2, this.text2, this.background2, this.bold2, this.border2, this.borderColor2, this.borderWidth2, this.fontColor2, this.fontSize2, this.alignment2);
        if (this.style2 == 'display:none') { this.style1 = this.style1.replace('flex-basis:50%', 'flex-basis:100%'); }
    }
        style(title, text, background, bold, border, borderColor, borderWidth, fontColor, fontSize, alignment) {
            if (title || text) {
                let styles = ['flex-basis:50%'];

                if (this.boxShadow) { styles.push('box-shadow:var(--slds-c-card-shadow, var(--sds-c-card-shadow, var(--lwc-cardShadow, 0 2px 2px 0 rgba(0, 0, 0, 0.10))))'); }

                if (background) { styles.push('background-color:' + background); }
                if (bold)       { styles.push('font-weight:bold'); }
                if (border)     { styles.push(`border:${borderWidth} solid ${borderColor}`) };
                if (fontColor)  { styles.push('color:' + fontColor); }
                if (fontSize)   { styles.push('font-size:' + fontSize); }
                if (alignment)  { styles.push('text-align:' + alignment); if (alignment != 'justify') {styles.push('justify-content:' + alignment);} }

                return styles.join(';');
            } else {return 'display:none';}
        }

    buildVisibilityFilterObjects() {
        // Expects filters formatted as a normal expression, like "Field__c = Some long value" or "(Case)What.Related_Object__r.Field__c != null".
        // To provide more than one filter, separate them with a double colon "::" like "Field__c = Some long value :: Other_Field__c != null".
        // Supports dynamic text replacement on both sides of the supported operators like "{{Field__c}} = {{Other_Field__c}}", but it should only be used on the right side since the left side should be a field reference.
        // Supports polymorphic references like "(Case)What.Related_Object__r.Field__c != null".
        // Supports "null" used on the right side of the equation.

        if (this.visibilityFilters) {
            let filters          = this.visibilityFilters.split('::').map(filter => filter.trim());
            this.visibilityFilterObjects = filters.map(filter => this.visibilityFilterObject(filter));
        }
        else {this.visibilityFilterObjects = [];}
    }
        visibilityFilterObject(filter) {
            let visibilityByOperator = {'==': (fieldValue, compareValue) => {return fieldValue == compareValue},
                                        '!=': (fieldValue, compareValue) => {return fieldValue != compareValue},
                                        '<>': (fieldValue, compareValue) => {return fieldValue != compareValue},
                                        '<=': (fieldValue, compareValue) => {return fieldValue <= compareValue},
                                        '>=': (fieldValue, compareValue) => {return fieldValue >= compareValue},
                                        '=' : (fieldValue, compareValue) => {return fieldValue == compareValue},
                                        '<' : (fieldValue, compareValue) => {return fieldValue  < compareValue},
                                        '>' : (fieldValue, compareValue) => {return fieldValue  > compareValue}
            };

            let operator = this.findFirstSubstring(filter, Object.keys(visibilityByOperator));

            let filterParts = filter.split(operator).map(part => part.trim());

            return {field: filterParts[0], operator: operator, value: filterParts[1]};
        }
            findFirstSubstring(mainString, substrings) {
                for (const sub of substrings) {
                    if (mainString.includes(sub)) {return sub;}
                }
                return null;
            }

    buildFieldData() {
        this.fieldData.titleFields1     = this.fields(this.title1);
        this.fieldData.textFields1      = this.fields(this.text1);
        this.fieldData.titleFields2     = this.fields(this.title2);
        this.fieldData.textFields2      = this.fields(this.text2);
        this.fieldData.linkFields1      = this.fields(this.bannerLink1);
        this.fieldData.linkFields2      = this.fields(this.bannerLink2);
        this.fieldData.visibilityFields = this.fields(this.visibilityFilters);
        this.fieldData.noTranslation    = this.visibilityFilterObjects.map(visibilityObject => visibilityObject.field).filter(field => !(field.startsWith(this.markupL) && field.endsWith(this.markupR)));

        this.fieldData.allFields = new Set([...this.fieldData.titleFields1,
                                            ...this.fieldData.textFields1,
                                            ...this.fieldData.titleFields2,
                                            ...this.fieldData.textFields2,
                                            ...this.fieldData.linkFields1,
                                            ...this.fieldData.linkFields2,
                                            ...this.fieldData.visibilityFields,
                                            ...this.fieldData.noTranslation]);
    }
        fields(text) {
            let fields = new Set();

            while (text && text.search(this.markupRegex) != -1) {
                let markedField = this.markedField(text);
                let field       = this.fieldWithoutMarkup(markedField);

                fields.add(field);
                text = text.replace(markedField, '');
            }

            return fields;
        }
            markedField(searchText) {
                let openMark = searchText.search(this.markupRegex);
                if (openMark != -1) {
                    let closeMark = searchText.indexOf(this.markupR, openMark + 1) + 2;
                    return searchText.substring(openMark, closeMark);
                } else { return false; }
            }
            fieldWithoutMarkup(field) {
                return field.replace(this.markupL, '').replace(this.markupR, '');
            }

    getRecordData() {
        let inputs = {
            fields: [...this.fieldData.allFields],
            sobject_name: this.objectApiName,
            and_filters: ['Id', '=', this.recordId]
        };

        return getRecords(inputs);
    }

    translateText() {
        this.translatedTitle1            = this.textWithFieldsReplaced(this.title1,            this.recordData, this.fieldData.titleFields1);
        this.translatedText1             = this.textWithFieldsReplaced(this.text1,             this.recordData, this.fieldData.textFields1);
        this.translatedBannerLink1       = this.textWithFieldsReplaced(this.bannerLink1,       this.recordData, this.fieldData.linkFields1);
        this.translatedTitle2            = this.textWithFieldsReplaced(this.title2,            this.recordData, this.fieldData.titleFields2);
        this.translatedText2             = this.textWithFieldsReplaced(this.text2,             this.recordData, this.fieldData.textFields2);
        this.translatedBannerLink2       = this.textWithFieldsReplaced(this.bannerLink2,       this.recordData, this.fieldData.linkFields2);
        this.translatedVisibilityFilters = this.textWithFieldsReplaced(this.visibilityFilters, this.recordData, this.fieldData.visibilityFields);
    }
        textWithFieldsReplaced(text, record, fields) {
            fields.forEach(field => {
                let markedField = this.markupL + field + this.markupR;
                let fieldValue  = this.objectValueByString(record, this.fieldWithoutCastingObject(field));

                text = text.replaceAll(markedField, fieldValue ?? ''); // To avoid "undefined" displaying on the component, convert null/undefined values to empty strings
            });

            return text;
        }
            fieldWithoutCastingObject(field) {
                // For accommodating polymorphic relationships. Finds a leading word in parentheses - accommodates polymorphic references where the SObject comes before the polymorphic reference in parentheses, like (Case)What.Related_Object__r.Related_Field__c
                return field.replace(/^\([^)]*\)/, '')
            }

    setVisibility() {
        // Custom logic can be applied to a collection of filters like in other areas of Salesforce, using numbers, parentheses, and English operators [AND, OR, NOT] (must be fully capitalized). Also supports coded operators [&&, ||, !].

        if (this.visibilityFilters) {
            let filters          = this.visibilityFilters.split('::').map(filter => filter.trim());
            let evaluatedFilters = filters.map(filter => this.evaluateOneVisibilityFilter(filter));

            if (this.visibilityLogic) {
                let pattern              = /AND|OR|NOT|&&|\|\||!|\(|\)|[0-9]/g;
                let logicParts           = this.visibilityLogic.match(pattern);
                let partsWithEvaluations = logicParts.map(part => this.evaluatedFilterPart(evaluatedFilters, part));
                let logicString          = partsWithEvaluations.join('').replace(/AND/g, '&&').replace(/OR/g, '||').replace(/NOT/g, '!');

                this.visible = eval(logicString);
            }
            else {
                this.visible = evaluatedFilters.every(Boolean);
            }
        }
        else {this.visible = true;}
    }
        evaluateOneVisibilityFilter(filter) {
            let visibilityByOperator = {'==': (fieldValue, compareValue) => {return fieldValue == compareValue},
                                        '!=': (fieldValue, compareValue) => {return fieldValue != compareValue},
                                        '<>': (fieldValue, compareValue) => {return fieldValue != compareValue},
                                        '<=': (fieldValue, compareValue) => {return fieldValue <= compareValue},
                                        '>=': (fieldValue, compareValue) => {return fieldValue >= compareValue},
                                        '=' : (fieldValue, compareValue) => {return fieldValue == compareValue},
                                        '<' : (fieldValue, compareValue) => {return fieldValue  < compareValue},
                                        '>' : (fieldValue, compareValue) => {return fieldValue  > compareValue}
            };

            let operator = this.findFirstSubstring(filter, Object.keys(visibilityByOperator));

            let filterParts = filter.split(operator).map(part => part.trim());
            let [field, value] = filterParts;

            let fieldValue = this.fieldData.allFields.has(field) ? this.objectValueByString(this.recordData, this.fieldWithoutCastingObject(field)) : field;
            if (value.toLocaleLowerCase() == 'null') {value = null;}

            let evaluation = visibilityByOperator[operator](fieldValue, value);
            return evaluation;
        }
            findFirstSubstring(mainString, substrings) {
                for (const sub of substrings) {
                    if (mainString.includes(sub)) {return sub;}
                }
                return null;
            }

        evaluatedFilterPart(evaluatedFilters, part) {
            return (Number.isInteger(Number(part))) ?  evaluatedFilters[Number(part) - 1] : part;
        }

    objectValueByString(obj, path) {
        return path.split('.').reduce(function(prev, curr) {
            return prev ? prev[curr] : null
        }, obj || self)
    }

    toggleCollapse() {
        this.collapse = !this.collapse;
    }

    openButtonLink(event) {
        let linkNumber = event.target?.dataset?.linkNumber;
        let link       = this['translatedBannerLink' + linkNumber];

        if (link) {
            let typeMap = {"Record Page": "standard__recordPage", "Web Page": "standard__webPage"};
            let type    = typeMap[this['linkType' + linkNumber]] ?? link.includes('://') ? 'standard__webPage' : 'standard__recordPage';
            let newTab  = this['linkNewTab' + linkNumber];

            let settings;
            switch(type) {
                case 'standard__recordPage':
                    settings = {type: type, attributes: {actionName: 'view', recordId: link.replace('/', '')}};
                    if (newTab) {this[NavigationMixin.GenerateUrl](settings).then(url => {window.open(url, '_blank');});}
                    else        {this[NavigationMixin.Navigate](settings);}
                    break;
                case 'standard__webPage':
                    settings = {type: type, attributes: {url: link}};
                    this[NavigationMixin.Navigate](settings);
                    break;
            }
        }

    }

    refreshContainer() {this.buildDataObjects();}

}