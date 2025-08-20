@isTest
public class TestData {

    public static Account account(Boolean insert_me) {
        Account account = new Account(Name              = 'Test ' + Utilities.random_string(10) + ' Account',
                                      BillingStreet     = '123 Test Street',
                                      BillingCity       = 'Test City',
                                      BillingState      = 'Colorado',
                                      BillingPostalCode = '12345',
                                      BillingCountry    = 'United States');
        if (insert_me) {insert account;}
        return account;
    }
    public static Account account() {return account(false);}
    public static Account account(String name) {
        Account test_account = TestData.account();
        test_account.Name    = name;
        return test_account;
    }

    public static Opportunity opportunity()                  {return opportunity(false);}
    public static Opportunity opportunity(Boolean insert_me) {return opportunity(insert_me, null);}
    public static Opportunity opportunity(Boolean insert_me, Account account) {
        Opportunity opportunity = new Opportunity(Name = 'Test Opportunity', StageName = Utilities.first_picklist_value('Opportunity', 'StageName'), CloseDate = Date.today());

        if (account != null) {opportunity.AccountId = account.Id;}
        if (insert_me)       {insert opportunity;}

        return opportunity;
    }

}