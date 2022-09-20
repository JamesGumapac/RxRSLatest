/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record','N/search'],
    /**
 * @param{record} record
 */
    (record,search) => {
        var RRSEARCH = 'customsearch_rr_search'
        var RETURN_PACKAGE_SEARCH = 'customsearch_kd_package_return_search'
        var RELATED_RECORDS_SEARCH = 'customsearch_kd_retreq_related_records'
        var PACKAGERECEIPT = 'CuTrSale';
        var RETURNAUTHORIZATION = 'RtnAuth'
        var CREDITMEMO = 'CustCred';
        var SALESORDER = 'SalesOrd';
        var INVOICE = 'CustInvc';
        var ITEMRECEIPT = 'ItemRcpt'
        var package_receipt;
        var return_authorization;
        var credit_memo;
        var sales_order = [];
        var custinvoice;
        var item_receipt;
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (context) => {
            var mrrRec = context.newRecord
            var mrrId = mrrRec.id;
            var rrIds = []
            if(mrrRec){

                var rrSearch = search.load({
                    id: RRSEARCH
                });
                rrSearch.filters.push(search.createFilter({
                    name: "custbody_kd_master_return_id",
                    operator: 'anyof',
                    values: mrrId
                }))

                rrSearch.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var rrId = result.id
                    rrIds.push(rrId)
                    return true;
                });
            log.debug('RRIds ', rrIds)
              if(rrIds){
                  for (var i = 0; i <rrIds.length; i++) {
                      var relatedRecordSearch = search.load({
                          id: RELATED_RECORDS_SEARCH
                      });
                      relatedRecordSearch.filters.push(search.createFilter({
                          name: "custbody_kd_return_request",
                          operator: 'anyof',
                          values: rrIds[i]
                      }))
                      log.debug('Related Record Search ', relatedRecordSearch)
                      var searchResultCount = relatedRecordSearch.runPaged().count;
                      if (searchResultCount > 0) {


                          relatedRecordSearch.run().each(function (result) {

                              var tranid = result.id;
                              var type = result.getValue({name: 'type'})
                              log.debug('Trand id ', tranid)
                              log.debug('Type ', type)
                              switch (type) {
                                  case RETURNAUTHORIZATION:
                                      return_authorization = result.id;
                                      break;
                                  case PACKAGERECEIPT:
                                      package_receipt = result.id;
                                      break;
                                  case CREDITMEMO:
                                      credit_memo = result.id;
                                      break;
                                  case SALESORDER:
                                      sales_order.push(result.id);
                                      break;
                                  case INVOICE:
                                      custinvoice = result.id;
                                      break;
                                  case ITEMRECEIPT:
                                      item_receipt = result.id;
                                      break;

                                  default:
                                  // code block
                              }


                              return true;
                          });
                          log.debug('Return Request Id', rrIds[i])
                          if (rrIds[i]) {

                              var packageSearchObj = search.load({
                                  id: RETURN_PACKAGE_SEARCH
                              });
                              packageSearchObj.filters.push(search.createFilter({
                                  name: "custrecord_kod_packrtn_rtnrequest",
                                  operator: 'anyof',
                                  values: rrIds[i]
                              }))
                              log.debug('Package OBJ', JSON.stringify(packageSearchObj))
                              packageSearchObj.run().each(function (result) {
                                  log.debug('sales order', sales_order)
                                  log.debug('invoice', custinvoice)
                                  log.debug('credit memo', credit_memo)
                                  log.debug('package receipt', package_receipt);
                                  log.debug('return authorization', return_authorization)
                                  log.debug('item receipt', item_receipt)
                                  var returnPackageId = result.getValue({
                                      name: 'internalid'
                                  });
                                  log.debug('Return Package Id ' + returnPackageId)
                                  var returnPackage = record.load({
                                      type: 'customrecord_kod_mr_packages',
                                      id: returnPackageId
                                  })
                                  custinvoice ? returnPackage.setValue({
                                      fieldId: 'custrecord_kod_packrtn_destrinv',
                                      value: custinvoice
                                  }) : false


                                  item_receipt ? returnPackage.setValue({
                                      fieldId: 'custrecord_kod_packrtn_rmareceipt',
                                      value: item_receipt
                                  }) : false

                                  return_authorization ? returnPackage.setValue({
                                      fieldId: 'custrecord_kod_packrtn_rma',
                                      value: return_authorization
                                  }) : false

                                  package_receipt ? returnPackage.setValue({
                                      fieldId: 'custrecord_kod_packrtn_packrcpt',
                                      value: package_receipt
                                  }) : false

                                  sales_order ? returnPackage.setValue({
                                      fieldId: 'custrecord_kd_mfg_so',
                                      value: sales_order
                                  }) : false
                                  returnPackage.setValue({
                                      fieldId: 'custrecord_kod_packrcpt_creditmemo',
                                      value: credit_memo
                                  })


                                  var RPid = returnPackage.save({ignoreMandatoryFields: true})
                                  log.debug({title: 'returnPackage', details: RPid})




                                  return true;
                              });
                          }
                      }
                  }
              }
            }
        }

        return {onAction};
    });
