public without sharing class LWC_Utilities {
    @AuraEnabled(cacheable=true)
    public static SObject[] safe_records(String[] fields, String sobject_name, String[] and_filters, String[] or_filters, String and_or_between_filters, String order_by, Integer query_limit) {
        /* Protects against SOQL injection by clearing out apostrophes from the SOQL input

            Note: This does support querying related fields. It does NOT support child records or sub-select queries

            Filters should be a lists of Strings with a size that is a multiple of three.
            For each triplet of strings, the first is the field name, the second is the operator, and the third is the value.
            and_filters will all use AND to join them. or_filters will use OR between them.
            and_or_between_filters determines how to join the two sets of filters

            Example of and_filters:
                ['AnnualRevenue', '>', '100000', 'CreatedDate', '=', 'THIS_YEAR'] -> (AnnualRevenue > 100000 AND CreatedDate = THIS_YEAR)

            Complex example:
                and_filters: ['AnnualRevenue', '>', '100000', 'CreatedDate', '=', 'THIS_YEAR']
                or_filters: ['CALENDAR_MONTH(CreatedDate)', '=', '1', 'CALENDAR_MONTH(CreatedDate)', '=', '4']
                and_or_between_filters: 'AND'
                    -> (AnnualRevenue > 100000 AND CreatedDate = THIS_YEAR) AND (CALENDAR_MONTH(CreatedDate) = 1 OR CALENDAR_MONTH(CreatedDate) = 4)
        */

        String query = select_string(fields) + ' ' +
                           'FROM ' + sobject_name + ' ' +
                            all_filters_string(sobject_name, and_filters, or_filters, and_or_between_filters) + ' ' +
                            (String.isNotBlank(order_by) ? 'ORDER BY ' + order_by.remove('\'') + ' ' : '' ) +
                            (query_limit != null ? 'LIMIT ' + query_limit : '');

        System.debug('LWC Utilities.safe records | query: ' + query);
        try                    {return Database.query(query);}
        catch(Exception error) {throw new AuraHandledException(error.getMessage());}
    }

        private static String select_string(String[] fields) {
            String[] fields_for_select  = new String[]{};
            String[] polymorphic_fields = new String[]{};

            for (String field : safe_strings(fields)) {
                if (!is_polymorphic(field)) {fields_for_select.add(field);}
                else                        {polymorphic_fields.add(field);}
            }

            if (!polymorphic_fields.isEmpty()) {fields_for_select.addAll(polymorphic_select_strings(polymorphic_fields));}

            return 'SELECT ' + String.join(fields_for_select, ', ');
        }
            private static Boolean is_polymorphic(String field) {
                /* Looks for three components: SObject Name, Polymorphic Reference, Field

                    Formatted as (sobject_name)polymorphic_reference.field

                    Example: (Case)What.Related_Object__r.Related_Field__c
                        SObject Name: Case
                        Polymorphic Reference: What
                        Field: Related_Object__r.Related_Field__c

                    No whitespace allowed
                */

                Pattern a_pattern = pattern.compile('\\(\\w+\\)\\w+\\.[\\w\\.]+');
                return a_pattern.matcher(field).matches();
            }
            private static String[] polymorphic_select_strings(String[] fields) {
                String[] select_strings = new String[]{};

                Map<String, Map<String, String[]>> polymorphic_fields_by_sobject_by_reference = polymorphic_fields_by_sobject_by_reference(fields);

                for (String reference : polymorphic_fields_by_sobject_by_reference.keySet()) {
                    select_strings.add(select_string_from_polymorphic_related_fields(reference, polymorphic_fields_by_sobject_by_reference.get(reference)));
                }

                return select_strings;
            }
                private static Map<String, Map<String, String[]>> polymorphic_fields_by_sobject_by_reference(String[] fields) {
                    // Expecting a collection of Strings that each start with an SObject in parentheses and are followed by related field linked through a single polymorphic relationship
                    // Example: (Case)What.Related_Object__r.Related_Field__c

                    Map<String, Map<String, String[]>> polymorphic_fields_by_sobject_by_reference = new Map<String, Map<String, String[]>>{};

                    for (String field : fields) {
                        String   sobject_name          = field.substringBetween('(', ')');
                        String[] related_field_parts   = field.substringAfter(')').split('\\.', 2);
                        String   polymorphic_reference = related_field_parts[0];
                        String   related_field         = related_field_parts[1];

                        if (!polymorphic_fields_by_sobject_by_reference.containsKey(polymorphic_reference))                   {polymorphic_fields_by_sobject_by_reference.put(polymorphic_reference, new Map<String, String[]>{});}
                        if (!polymorphic_fields_by_sobject_by_reference.get(polymorphic_reference).containsKey(sobject_name)) {polymorphic_fields_by_sobject_by_reference.get(polymorphic_reference).put(sobject_name, new String[]{});}
                        polymorphic_fields_by_sobject_by_reference.get(polymorphic_reference).get(sobject_name).add(related_field);
                    }

                    return polymorphic_fields_by_sobject_by_reference;
                }
                private static String select_string_from_polymorphic_related_fields(String reference, Map<String, String[]> fields_by_sobject) {
                    String[] when_thens = new String[]{};

                    for (String sobject_name : fields_by_sobject.keySet()) {
                        when_thens.add('WHEN ' + sobject_name + ' THEN ' + String.join(fields_by_sobject.get(sobject_name), ', '));
                    }

                    return 'TYPEOF ' + reference + ' ' + String.join(when_thens, ' ') + ' END';
                }
        private static String[] safe_strings(String[] strings) {
            String[] safe_strings = new String[]{};
            for (String original : strings) {safe_strings.add(original.remove('\'').trim());}
            return safe_strings;
        }
        public static String all_filters_string(String sobject_name, String[] and_filters, String[] or_filters, String and_or_between_filters) {
            String[] filter_strings = new String[]{};

            String and_filter_string = filter_string(and_filters, sobject_name, ' AND ');
            String or_filter_string  = filter_string(or_filters,  sobject_name, ' OR ');
            if (and_filter_string != null) {filter_strings.add(and_filter_string);}
            if (or_filter_string  != null) {filter_strings.add(or_filter_string);}

            return filter_strings.isEmpty() ? '' : 'WHERE ' + String.join(filter_strings, ' ' + (and_or_between_filters != null ? and_or_between_filters : 'AND') + ' ');
        }
        private static String filter_string(String[] filter_data, String sobject_name, String and_or) {
            if (filter_data == null || filter_data.isEmpty()) {return null;}

            Assert.areEqual(0, Math.mod(filter_data.size(), 3));
            String[] safe_data = safe_strings(filter_data);

            Integer filter_count = filter_data.size() / 3;

            String[] filters = new String[]{};
            for (Integer i = 0; i < filter_count; i++) {
                Integer this_filter_start = i * 3;
                filters.add(single_filter_string(sobject_name, safe_data[this_filter_start], safe_data[this_filter_start + 1], safe_data[this_filter_start + 2]));
            }

            return '(' + String.join(filters, and_or) + ')';
        }
            private static String single_filter_string(String sobject_name, String field, String operator, String value) {
                // 'field' can actually be something more complicated than a field, like a SOQL function. For example, CALENDAR_MONTH(CreatedDate)
                // So, we have to extract the real field before checking the SOAP Type.
                String base_field = field.contains('(') ? field.substringBetween('(', ')') : field;

                Set<String> string_types = new Set<String>{String.valueOf(SOAPType.STRING), String.valueOf(SOAPType.ID)};
                system.debug('LWC Utilities.single filter string | sobject_name: ' + sobject_name);
                system.debug('LWC Utilities.single filter string | base_field: ' + base_field);
                if (string_types.contains(Utilities.related_field_type(sobject_name, base_field))) {value = '\'' + value + '\'';}
                return String.join(new String[]{field, operator, value}, ' ');
            }
}