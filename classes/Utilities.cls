public abstract class Utilities {

   public static String sobject_name(SObject record) {
      return String.valueOf(record.getSObjectType());
   }
   public static SObject record_instance(String object_name) {
      return (SObject)Type.forName('', object_name).newInstance();
   }
   public static Schema.DescribeSObjectResult sobject_description(String object_name) {
      return (record_instance(object_name)).getSObjectType().getDescribe();
   }

   public static String          field_label(    String object_name, String field_name) {return field_info(object_name, field_name).getLabel();}
   public static Schema.SOAPType field_soap_type(String object_name, String field_name) {return field_info(object_name, field_name).getSOAPType();}

   public static String related_object_name(String sobject_name, String relationship_field) {
      // Returns the API Name of the Sobject that a field references. For example, Account.CreatedById references the "User" object.
      return field_info(sobject_name, relationship_field).getReferenceTo()[0].getDescribe().getName();
   }
   public static Schema.DescribeFieldResult field_info(String object_name, String field_name) {
      return field_map(object_name).get(field_name).getDescribe();
   }
   public static Map<String, Schema.SObjectField> field_map(String object_name) {
      return sobject_description(object_name).fields.getMap();
   }

   public static String related_field_label(String  sobject_name, String target_field) {return related_field_info(sobject_name,         target_field, 'label');}
   public static String related_field_label(sObject record,       String target_field) {return related_field_info(sobject_name(record), target_field, 'label');}
   public static String related_field_type(String   sobject_name, String target_field) {return related_field_info(sobject_name,         target_field, 'type');}
   public static String related_field_type(sObject  record,       String target_field) {return related_field_info(sobject_name(record), target_field, 'type');}
   public static String related_field_info(String sobject_name, String target_field, String output_type) {
      if (String.isNotBlank(sobject_name) && String.isNotBlank(target_field)) {
         Boolean has_related_sobject = target_field.contains('.');

         if (has_related_sobject) {
            String relationship_field = target_field.substringBefore('.');

            if (relationship_field.endsWith('__r')) {relationship_field = relationship_field.replace('__r', '__c');}
            else                                    {relationship_field += 'Id';}

            return related_field_info(related_object_name(sobject_name, relationship_field), target_field.substringAfter('.'), output_type);
         } else {
            switch on output_type {
               when 'label' {return field_label(sobject_name, target_field);}
               when 'type'  {return String.valueOf(field_soap_type(sobject_name, target_field));}
               when else    {return null;}
            }
         }
      } else {return null;}
   }

   public static Object related_field(sObject an_sobject, String target_field) {return related_field(an_sobject, target_field, 'value');}
   public static Object related_field(sObject record, String target_field, String output_type) {
      // This is a recursive method that returns a related field's value or type from a generic sObject... like the Name of the Manager of the Owner of a record.
      // If any sObject along the way is null, it returns null.
      // record is any sObject with or without related sObjects
      // target_field is the SOQL-formatted reference to a field, as it would be reference from record...
      //    For example, if you have an Opportunity and want its Account's Owner's Manager's Name,
      //    record is the Opportunity record and "Account.Owner.Manager.Name" is the target_field

      switch on output_type {
         when 'label', 'type' {return related_field_info(sobject_name(record), target_field, output_type);}
         when 'value' {
            if (record != null) {
               Boolean has_related_sobject = target_field.contains('.');

               if (has_related_sobject) {
                  String next_related_sobject = target_field.substringBefore('.');
                  return related_field(record.getSObject(next_related_sobject), target_field.substringAfter('.'), output_type);
               } else {
                  return record.get(target_field);
               }
            } else {return null;}
         }
         when else {return null;}
      }
   }

   public static String random_string(Integer count) {
      final String chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
      String random_string = '';
      while (random_string.length() < count) {
         Integer index = Math.mod(Math.abs(Crypto.getRandomInteger()), chars.length());
         random_string += chars.substring(index, index + 1);
      }
      return random_string;
   }

   public static String[] picklist_values(String object_name, String field_name) {
      Map<String, String> labels_by_api_name = picklist_labels_by_api_name(object_name, field_name);
      return new List<String>(labels_by_api_name.keySet());
   }
   public static String first_picklist_value(String object_name, String field_name) {return picklist_values(object_name, field_name)[0];}

   public static String[] picklist_labels(String object_name, String field_name) {
      Map<String, String> labels_by_api_name = picklist_labels_by_api_name(object_name, field_name);
      return labels_by_api_name.values();
   }

   public static Map<String, String> picklist_labels_by_api_name(String object_name, String field_name) {
      Map<String, String> labels_by_api_name = new Map<String, String>{};
      String[] types  = new String[]{object_name};
      Schema.DescribeSobjectResult[] results = Schema.describeSObjects(types);
      for(Schema.DescribeSobjectResult res : results) {
         for (Schema.PicklistEntry entry : res.fields.getMap().get(field_name).getDescribe().getPicklistValues()) {
            if (entry.isActive()) {labels_by_api_name.put(entry.getValue(), entry.getLabel());}
         }
      }
      return labels_by_api_name;
   }

}