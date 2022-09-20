/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

/*

------------------------------------------------------------------------------------------
Script Information
------------------------------------------------------------------------------------------

Name:
SQL Query Tool

ID:
_sql_query_tool

Description
A utility for running SQL queries against a NetSuite instance.


------------------------------------------------------------------------------------------
Developer(s)
------------------------------------------------------------------------------------------

Tim Dietrich
• timdietrich@me.com
• https://timdietrich.me


------------------------------------------------------------------------------------------
History
------------------------------------------------------------------------------------------

20200801 - Tim Dietrich
• Initial version.

20200805 - Tim Dietrich
• Added support for displaying the results in a sublist.


*/


var
    log,
    query,
    serverWidget;


define( [ 'N/log', 'N/query', 'N/ui/serverWidget' ], main );


function main( logModule, queryModule, serverWidgetModule ) {

    log = logModule;
    query= queryModule;
    serverWidget = serverWidgetModule;

    return {

        onRequest: function( context ) {

            // Create a form.
            var form = serverWidget.createForm(
                {
                    title: 'SuiteQL Query Tool',
                    hideNavBar: false
                }
            );

            // Add a submit button.
            form.addSubmitButton( { label: 'Run Query' } );

            // Add the query field.
            var queryField = form.addField(
                {
                    id: 'custpage_field_query',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Query'
                }
            );

            // Make the query field required.
            queryField.isMandatory = true;

            // If the form has been submitted...
            if ( context.request.method == 'POST' ) {

                // Set the query field's default value.
                queryField.defaultValue = context.request.parameters.custpage_field_query;

                // Add the Results field.
                var resultsField = form.addField(
                    {
                        id: 'custpage_field_results',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'Results'
                    }
                );

                try {

                    // Run the query.
                    var queryResults = query.runSuiteQL(
                        {
                            query: context.request.parameters.custpage_field_query
                        }
                    );

                    // Get the mapped results.
                    var beginTime = new Date().getTime();
                    var records = queryResults.asMappedResults();
                    var endTime = new Date().getTime();
                    // var elapsedTime = Math.round( endTime - beginTime );
                    var elapsedTime = endTime - beginTime ;

                    // Adjust the label so that it includes the number of results.
                    resultsField.label = queryResults.results.length + ' Results (JSON)';

                    // If records were returned...
                    if ( records.length > 0 ) {

                        // Create a sublist for the results.
                        var resultsSublist = form.addSublist(
                            {
                                id : 'results_sublist',
                                label : 'Results (' + records.length + ' records retrieved in ' + elapsedTime + 'ms)',
                                type : serverWidget.SublistType.LIST
                            }
                        );

                        // Get the column names.
                        var columnNames = Object.keys( records[0] );

                        // Loop over the column names...
                        for ( i = 0; i < columnNames.length; i++ ) {

                            // Add the column to the sublist as a field.
                            resultsSublist.addField(
                                {
                                    id: 'custpage_results_sublist_col_' + i,
                                    type: serverWidget.FieldType.TEXT,
                                    label: columnNames[i]
                                }
                            );

                        }

                        // Add the records to the sublist...
                        for ( r = 0; r < records.length; r++ ) {

                            // Get the record.
                            var record = records[r];

                            // Loop over the columns...
                            for ( c = 0; c < columnNames.length; c++ ) {

                                // Get the column name.
                                var column = columnNames[c];

                                // Get the column value.
                                var value = record[column];
                                if ( value != null ) {
                                    value = value.toString();
                                }

                                // Add the column value.
                                resultsSublist.setSublistValue(
                                    {
                                        id : 'custpage_results_sublist_col_' + c,
                                        line : r,
                                        value : value
                                    }
                                );

                            }

                        }

                    }

                    // Set the results field to a text version of the mapped results.
                    // This will fail if the text is > 100000 characters.
                    // However, the results sublist will still render properly.
                    resultsField.defaultValue = JSON.stringify( records, null, 2 );

                } catch( e ) {

                    // Update the results field to reflect the error.
                    resultsField.label = 'Error';
                    resultsField.defaultValue = e.message;

                }

            }

            // Add an inline HTML field so that JavaScript can be injected.
            var jsField = form.addField(
                {
                    id: 'custpage_field_js',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Javascript'
                }
            );

            // Add Javascript...
            jsField.defaultValue = '<script>\r\n';

            // Adjust the size of the textareas.
            jsField.defaultValue += 'document.getElementById("custpage_field_query").rows=20;\r\n';
            if ( context.request.method == 'POST' ) {
                jsField.defaultValue += 'document.getElementById("custpage_field_results").rows=20;\r\n';
            }

            // Use jQuery to modify the tab key's behavior when in the query textarea.
            // This allows the user to use the tab key when editing a query.
            // Source: https://stackoverflow.com/questions/6140632/how-to-handle-tab-in-textarea
            jsField.defaultValue += 'window.jQuery = window.$ = jQuery;\r\n';
            jsField.defaultValue += '$(\'textarea\').keydown(function(e) {\r\n';
            jsField.defaultValue += 'if(e.keyCode === 9) {\r\n';
            jsField.defaultValue += 'var start = this.selectionStart;\r\n';
            jsField.defaultValue += 'var end = this.selectionEnd;\r\n';
            jsField.defaultValue += 'var $this = $(this);\r\n';
            jsField.defaultValue += 'var value = $this.val();\r\n';
            jsField.defaultValue += '$this.val(value.substring(0, start)';
            jsField.defaultValue += '+ "	"';
            jsField.defaultValue += '+ value.substring(end));\r\n';
            jsField.defaultValue += 'this.selectionStart = this.selectionEnd = start + 1;\r\n';
            jsField.defaultValue += 'e.preventDefault();\r\n';
            jsField.defaultValue += '}\r\n';
            jsField.defaultValue += '});\r\n';

            jsField.defaultValue += '</script>';

            // Display the form.
            context.response.writePage( form );

        }

    }

}