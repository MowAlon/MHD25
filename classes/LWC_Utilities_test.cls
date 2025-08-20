@isTest
public class LWC_Utilities_test {

    @isTest static void test_safe_records() {
        String[] fields = new String[]{'Id', 'Name', 'CreatedBy.Name'};

        Account account = TestData.account(true);

        Account expected_account = Database.queryWithBinds('SELECT ' + String.join(fields, ', ') + ' FROM Account WHERE Id = :account_id', new Map<String, Object>{'account_id' => account.Id}, AccessLevel.SYSTEM_MODE);

        Account actual_account = (Account)LWC_Utilities.safe_records(fields, 'Account', new String[]{'Id', '=', account.Id}, null, null, null, null)[0];

        System.assertEquals(expected_account.Id, actual_account.Id);
        System.assertEquals(expected_account.Name, actual_account.Name);
        System.assertEquals(expected_account.CreatedBy.Name, actual_account.CreatedBy.Name);
    }

    @isTest static void test_safe_records_with_polymorphic_relationships() {
        String[] fields = new String[]{'Id', 'Subject', '(Account)What.Name', '(Account)What.Owner.Name', '(Contact)Who.LastName'};

        Account account = TestData.account(true);
        account = [SELECT Name, Owner.Name FROM Account WHERE Id = :account.Id];

        Contact contact = new Contact(AccountId = account.Id, LastName = 'Test Last Name');
        insert contact;

        Task task = new Task(Subject = 'Test Task', WhatId = account.Id, WhoId = contact.Id);
        insert task;

        Task expected_task = [SELECT Id, Subject, TYPEOF What WHEN Account THEN Name, Owner.Name END, TYPEOF Who WHEN Contact THEN LastName END FROM Task WHERE Id = :task.Id];

        Task actual_task   = (Task)LWC_Utilities.safe_records(fields, 'Task', new String[]{'Id', '=', task.Id}, null, null, null, null)[0];

        System.assertEquals(expected_task.Id, actual_task.Id);
        System.assertEquals(expected_task.Subject, actual_task.Subject);
        System.assertEquals(account.Name, actual_task.getSObject('What').get('Name'));
        System.assertEquals(account.Owner.Name, actual_task.getSObject('What').getSObject('Owner').get('Name'));
        System.assertEquals(contact.LastName, actual_task.getSObject('Who').get('LastName'));
    }

}