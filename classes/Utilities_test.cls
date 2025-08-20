@isTest
public class Utilities_test extends Utilities {

   @isTest static void test_sobject_name() {
      SObject some_sobject_thats_really_an_account = TestData.account(true);
      System.assertEquals('Account', Utilities.sobject_name(some_sobject_thats_really_an_account));
   }

   @isTest static void test_field_label() {
      System.assertEquals('Account Name', Utilities.field_label('Account', 'Name'));
   }

   @isTest static void test_field_info() {
      System.assertEquals('STRING', String.valueOf(Utilities.field_info('Account', 'Name').getType()));
   }

   @isTest static void test_related_field() {
      Account parent_account = TestData.account('Parent');
      Account child_account  = TestData.account('Child');
      parent_account.AnnualRevenue = 666;
      insert parent_account;

      child_account.ParentId = parent_account.Id;
      insert child_account;

      Opportunity opp = TestData.opportunity(true, child_account);

      opp = [SELECT Account.Parent.AnnualRevenue FROM Opportunity WHERE Id = :opp.Id];
      Assert.areEqual(666, opp.Account.Parent.AnnualRevenue);

      Assert.areEqual(666,              (Decimal)related_field(opp, 'Account.Parent.AnnualRevenue'));
      Assert.areEqual('Annual Revenue', related_field_label(opp, 'Account.Parent.AnnualRevenue'));
      Assert.areEqual('DOUBLE',         related_field_type(opp, 'Account.Parent.AnnualRevenue'));
   }

   @isTest static void test_random_string() {
      Integer desired_length = 10;
      String random_string = Utilities.random_string(desired_length);
      System.assertEquals(desired_length, random_string.length());
   }

   @isTest static void test_picklist_values() {
      String[] values = Utilities.picklist_values('Opportunity', 'StageName');
      System.assert(!values.isEmpty());
   }

   @isTest static void test_first_picklist_value() {
      System.assertNotEquals(null, Utilities.first_picklist_value('Opportunity', 'StageName'));
   }
   
   @isTest static void test_picklist_labels() {
      String[] values = Utilities.picklist_labels('Opportunity', 'StageName');
      System.assert(!values.isEmpty());
   }
}