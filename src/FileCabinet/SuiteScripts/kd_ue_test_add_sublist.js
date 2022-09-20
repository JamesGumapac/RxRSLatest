function AddSublist(Context) {
	//create a custom tab to hold our Batch Approver Details
	var tab = Context.form.addTab({ id : 'custpage_batch_approval' ,label : 'Batch Approval Details' });
	
	//get the approval role from a deployment parameter
	var param_BatchApprovalRole = objCurrScript.getParameter({ name:'custscript_btx_batch_approval_role' });
	
	// for the Batch Approver role we want to make the TAB we are adding the first tab on the form
	// here we tell NetSuite to ‘insert’ our tab in front of an existing tab on the form which happens to have the ID ‘custom27’
	// the tab is already on the form, this really moves it rather than inserts it

	if (runtime.getCurrentUser().role == param_BatchApprovalRole) {
		 Context.form.insertTab({tab:tab ,nexttab:'custom27'});
	}


	// add a new custom field to the new TAB before adding the sublist
	var Owner = Context.newRecord.getText('owner');
	var fldOwner = Context.form.addField({ id:'custpage_owner' ,type:ui.FieldType.TEXT ,label:'Batch Owner' ,container:'custpage_batch_approval' });
	fldOwner.defaultValue = Owner;

	// add the custom SUBLST to the TAB
	var objSublist = Context.form.addSublist( {id: 'custpage_sublist1' ,type:ui.SublistType.LIST ,label: 'sublist1' ,tab:'custpage_batch_approval' });

	// run a saved search to get the data for the sublist
	// using a saved search allows sublist columns and data to dynamically be added/removed without modifying the script

	//get saved search via deployment parameter
	var param_SavedSearchId = objCurrScript.getParameter({ name:'custscript_bt_ue_pfa_saved_srch_id' });
	var objSublistSearch = search.load({ id: param_SavedSearchId });

	//in our use case, we want to add another filter to the saved search based on joining to a specific field that is this record's ID
	var fltrPFA = search.createFilter({ name:'custbody_9997_pfa_record' ,join:'applyingtransaction' ,operator:'ANYOF'  ,values:Context.newRecord.id  });
	objSublistSearch.filters.push(fltrPFA);

	
	var SublistSearch = objSublistSearch.run();
	var SublistSearchResults = SublistSearch.getRange(0, 1000);

	//add the columns to the sublist based on the search results, columns with label “nodisplay” are not added to sublist; note:
	//“nodisplay” allows columns we don’t want to see on the form to be in the search results for purposes such as sorting the results in a desired sequence

	//dynamically define the column list based on the saved search definition 
	var c = 0;
	SublistSearch.columns.forEach(function(col){
		c++;
		var colName = 'custpage_col' + c;
		if (col.label != 'nodisplay') {
			objSublist.addField({ id:colName ,label:col.label ,type: serverWidget.FieldType.TEXT });
		}
	});


	//now add rows to the sublist based on the search results, columns with label “nodisplay” are not added to sublist
	//only fill the first 1,000 rows based on early saved search work: do more crafty work if needed
	for (var ix = 0; ix < SublistSearchResults.length; ix++) {
		var result = SublistSearchResults[ix];                   
		var c = 0;
		
		//loop through the columns to fill the data
		for (var k in result.columns) {
			 
			c++;
			var colName = 'custpage_col' + c;                     

			if (result.columns[k].label != 'nodisplay') {
				var fieldValue;
				if ( result.getText(result.columns[k]) ){
					fieldValue = result.getText(result.columns[k]) 
				} else { 
					fieldValue = result.getValue(result.columns[k]) 
				};
				
				if (!fieldValue) { 
					fieldValue = ' '; 
				}
				//add the value to the row / column
				objSublist.setSublistValue({ id:colName ,value:fieldValue ,line: ix });
			}
		 } // where am I? for (var k in result.columns)
	} // where am I? for (var ix = 0; ix < SublistSearchResults.length; ix++)
}