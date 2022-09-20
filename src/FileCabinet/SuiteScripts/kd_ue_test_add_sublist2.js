/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'],
    function(record, serverWidget) {
        function beforeLoad(context) {
            //var tab = context.form.addTab({ id : 'custpage_batch_approval' ,label : 'Batch Approval Details' });
        
            //get the approval role from a deployment parameter
            //var param_BatchApprovalRole = objCurrScript.getParameter({ name:'custscript_btx_batch_approval_role' });
            
            // for the Batch Approver role we want to make the TAB we are adding the first tab on the form
            // here we tell NetSuite to ‘insert’ our tab in front of an existing tab on the form which happens to have the ID ‘custom27’
            // the tab is already on the form, this really moves it rather than inserts it
        
            //if (runtime.getCurrentUser().role == param_BatchApprovalRole) {
                context.form.addTab({id:'custpage_testtab' ,label:'gq tab'});
                log.debug('test', 'added tab')
            //}

            var objSublist = context.form.addSublist( {id: 'custpage_sublist1' ,type:serverWidget.SublistType.LIST ,label: 'sublist1' ,tab:'custpage_testtab' });
            objSublist.addField({ id:'test1' ,label:'fld1' ,type: serverWidget.FieldType.TEXT });
            objSublist.addField({ id:'test2' ,label:'fld2' ,type: serverWidget.FieldType.TEXT });
            //customsearch_gq_test_return_items_req
            objSublist.setSublistValue({ id:'test1' ,value:'TEST1' ,line: 0 });
            objSublist.setSublistValue({ id:'test2' ,value:'TEST2' ,line: 0 });

        }
        return {
            beforeLoad: beforeLoad
        };
    });