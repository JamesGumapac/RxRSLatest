/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function () {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */

        function pageInit(context) {
            console.log(context.mode)
            if (context.mode == 'create') {

                var rec = context.currentRecord;
                rec.setValue({fieldId: 'iswip', value: true})
                //  var fieldName = context.fieldId;

                // if (fieldName === 'assemblyitem') {
                //     rec.setValue({fieldId: 'iswip', value: true})
                //  }
            }
        }

        function postSourcing(context) {

            var rec = context.currentRecord;
            if (context.mode == 'create') {

                var fieldName = context.fieldId;

                if (fieldName === 'assemblyitem') {
                    rec.setValue({fieldId: 'iswip', value: true})
                }
            }
        }

        function fieldChanged(context) {

            var rec = context.currentRecord;


            var getField = context.fieldId

            if (getField == 'assemblyitem') {
                console.log('Field Change')
                rec.setValue({
                    fieldId: 'iswip',
                    value: true,
                    ignoreFieldChange: true
                })
            }

        }

        return {

            pageInit: pageInit,
            postSourcing: postSourcing,
            fieldChanged: fieldChanged

        };

    }
);
