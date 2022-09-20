/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(context) {
            var PHARMACALC = 8
            var PHARMACALC1 = 9
            var PHARMACAL2 = 10
            var PRICELEVEL;
            var PHARMAPRICINGORDER


            var cucRec = context.currentRecord;

            var sublistName = context.sublistId;
            var fieldName = context.fieldId


            if (sublistName == 'item') {
                if (fieldName == "item") {

                    var pharmaCalc
                    var phamarCalc1
                    var pharmaCalc2
                    log.debug({title: 'Checking Item name'})
                    var itemId = cucRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });

                    log.debug('Item Id', itemId)
                    cucRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        value: 'test'
                    })
                    var filters = new Array();
                    //Hard coding item internalID 8
                    filters[0] = search.createFilter({
                        name: 'internalID',
                        operator: search.Operator.IS,
                        values: itemId
                    });
                    var columns = new Array();
                    columns[0] = search.createColumn({
                        name: 'custitem_kodella_pricingorder'
                    });
                    columns[1] = search.createColumn({
                        name: 'price8'
                    });
                    columns[2] = search.createColumn({
                        name: 'price9'
                    });
                    columns[3] = search.createColumn({
                        name: 'price10'
                    });
                    var mySearch = search.create({
                        type: search.Type.ITEM,
                        filters: filters,
                        columns: columns
                    })
                    var result = mySearch.run();
                    //Price levels start with 'baseprice', then 'price' + 2 and up.


                    result.each(function (row) {

                        PHARMAPRICINGORDER = row.getValue({
                            name: 'custitem_kodella_pricingorder'
                        })
                        pharmaCalc = row.getValue({
                            name: 'price8'
                        })
                        phamarCalc1 = row.getValue({
                            name: 'price9'
                        })
                        pharmaCalc2 = row.getValue({
                            name: 'price10'
                        })


                        return true
                    })

                    log.debug('PharmaProcessing Order ' + PHARMAPRICINGORDER)
                    log.debug('calc value ' + pharmaCalc)
                    log.debug('calc1 value ' + phamarCalc1)
                    log.debug('calc2 value ' + pharmaCalc2)

                    switch (parseInt(PHARMAPRICINGORDER)) {
                        case 1:
                            log.debug('Pharma Order 1')
                            if (pharmaCalc > 0)
                                PRICELEVEL = PHARMACALC

                            break;
                        case 2:
                            // code block
                            break;
                        case 3:
                            // code block
                            break;
                        default:
                        // code block
                    }
                }

            }
        }


        return {

            fieldChanged: fieldChanged
        };

    });
