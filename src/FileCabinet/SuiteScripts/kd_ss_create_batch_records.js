/**
* @NApiVersion 2.x
* @NScriptType ScheduledScript
*/
define(['N/runtime', 'N/search', 'N/record', 'N/task'],
function(runtime, search, record, task) {
   var REC_MANUF = 'customrecord_csegmanufacturer';
   var REC_RET_REQ = 'customsale_kod_returnrequest';
   var REC_BATCH_RECORD = 'customrecord_kd_batch_record';
   var FLD_RR_FOR_SO_BATCH = 'custbody_kd_for_so_batch';
   var FLD_BATCH_TAGS = 'custrecord_kd_br_tag_nos';
   var FLD_BATCH_VALUE_OF_TAGS = 'custrecord_kd_br_value_of_tags';
   var FLD_BATCH_MANUF = 'custrecord_kd_br_manufacturer';
   var RR_ITEM_MANUF = 'custcol_kd_item_manufacturer';
   var RR_ITEM_TAG = 'custcol_kd_baglabel_link';
   var manufBatch = [];
   function getManufSoMaxAmount(manuf){
      var manufSoMax = 0;
      var fieldLookUp = search.lookupFields({
          type: REC_MANUF,
          id: manuf,
          columns: ['custrecord_kd_mfgmaxvaljue']
      });//4
      log.debug('TEST', JSON.stringify(fieldLookUp));
      if(fieldLookUp.custrecord_kd_mfgmaxvaljue != null){
         manufSoMax = fieldLookUp.custrecord_kd_mfgmaxvaljue;
      }
      //return fieldLookUp.custrecord_kd_mfgmaxvaljue;
      return manufSoMax;
   }
   function createBatchRecord(manuf, manufBatch){
      var rrIds, rrIdsUpdated = [], linesByRetReq, rrLines;
      var batchRec, rrRec, lineUniqueKey;
      for(var manufBatchIndx = 0; manufBatchIndx < manufBatch.length; manufBatchIndx++){
         batchRec = record.create({
            type: REC_BATCH_RECORD,
            isDynamic: true
         });
         batchRec.setValue({
            fieldId: FLD_BATCH_MANUF,
            value: manuf,
            ignoreFieldChange: true
         });
         batchRec.setValue({
            fieldId: FLD_BATCH_VALUE_OF_TAGS,
            value: manufBatch[manufBatchIndx].sumoftags,
            ignoreFieldChange: true
         });
         batchRec.setValue({
            fieldId: FLD_BATCH_TAGS,
            value: manufBatch[manufBatchIndx].tags,
            ignoreFieldChange: true
         });
         batchId = batchRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
         });
         log.debug('test', 'create record');
         log.debug('test', 'manuf ' + manuf);
         log.debug('test', 'sumoftags ' + manufBatch[manufBatchIndx].sumoftags);
         log.debug('test', 'tags ' + JSON.stringify(manufBatch[manufBatchIndx].tags));
         log.debug('test', 'linesbyrr ' + JSON.stringify(manufBatch[manufBatchIndx].linesbyrr));
         log.debug('test', 'save record');

         linesByRetReq = manufBatch[manufBatchIndx].linesbyrr;
         for(var rrId in linesByRetReq){
            rrLines = linesByRetReq[rrId];
            log.debug('test', 'LOAD rr ' + rrId);
            rrRec = record.load({
               type: REC_RET_REQ,
               id: rrId,
               isDynamic: true
            });
            for(var rrRecLineIndx = 0; rrRecLineIndx < rrRec.getLineCount('item'); rrRecLineIndx++){
               rrRec.selectLine({
                  sublistId: 'item',
                  line: rrRecLineIndx
               });
               lineUniqueKey = rrRec.getCurrentSublistValue({
                  sublistId: 'item',
                  fieldId: 'lineuniquekey'
               });
               log.debug('test', lineUniqueKey + ' IN ' + rrLines);
               if(rrLines.indexOf(lineUniqueKey) >= 0){
                  rrRec.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_kd_batch_record_created',
                     value: true,
                     ignoreFieldChange: true
                  });
                  rrRec.setCurrentSublistValue({
                     sublistId: 'item',
                     fieldId: 'custcol_kd_batch_id',
                     value: batchId,
                     ignoreFieldChange: true
                  });
               }
               rrRec.commitLine({
                  sublistId: 'item'
               });
            }
            /*for(var rrLineIndx = 0; rrLineIndx < rrLines.length; rrLineIndx++){
               log.debug('test', 'updating line ' + rrLines[rrLineIndx]);
            }*/
            rrRec.save({
               enableSourcing: true,
               ignoreMandatoryFields: true
            });           
            log.debug('test', 'SAVE rr ' + rrId);
         }
         /*rrIds = manufBatch[manufBatchIndx].retreqs;
         for(var rrIndx = 0; rrIndx < rrIds.length; rrIndx++){
            if(rrIds.indexOf(rrIds[rrIndx]) < 0){
               log.debug('test', 'update rr ' + rrIds[rrIndx]);
               record.record.submitFields({
                  type: REC_RET_REQ,
                  id: rrIds[rrIndx],
                  values: {
                     custbody_kd_for_so_batch: false
                  },
                  options: {
                      enableSourcing: false,
                      ignoreMandatoryFields : true
                  }
              });
              rrIdsUpdated.push(rrIds[rrIndx]);
            }
         }*/
      }
   }
   function createBatchRecords(searchId){
      log.debug('test', 'createBatchRecords START TEST')
      var rrLinesSearch = search.load({
         id: searchId
      });//5
      var start = 0;
      var end = 6;//1000;
      var searchRs = rrLinesSearch.run();
      var results = searchRs.getRange(start, end);//10
      log.debug('test', 'results length ' + results.length)
      //var manufBatch = [];
      var prevManuf, manuf, amount, tag, rrId, lineUniqueId, currIndx, manufSoMax;
      var calledCreateBatchRecord = false;
      var testCounter = 1;
      do{
         log.debug('test', 'entered do');
         for(var i = 0; i < results.length; i++){
            log.debug('test', 'result index' + i);
            manuf = results[i].getValue(RR_ITEM_MANUF);
            log.debug('test', 'manuf '+ manuf);
            if(manufSoMax == null){
               manufSoMax = getManufSoMaxAmount(manuf);//4
               log.debug('test', 'manuf SO max ' + manufSoMax);
            }
            if(prevManuf != null && manuf != prevManuf){
               log.debug('test', 'went to createBatchRecord');
               log.debug('test', 'manufBatch ' + JSON.stringify(manufBatch));
               createBatchRecord(prevManuf, manufBatch);
               calledCreateBatchRecord = true;
               break;
               log.debug('test', 'wentback after');
               manufSoMax = null;
               manufBatch = [];
               if(i != results.length -1){
                  i--;
               }
            }else{
               amount = parseFloat(results[i].getValue('amount')) * -1;
               tag = results[i].getValue(RR_ITEM_TAG);
               lineUniqueId = results[i].getValue('lineuniquekey');
               rrId = results[i].id;
               if(manufBatch.length == 0){
                  manufBatch.push({
                     sumoftags: amount,
                     tags: [tag],
                     linesbyrr: {}
                     //retreqs: [rrId]
                  });
                  manufBatch[manufBatch.length-1].linesbyrr[rrId] = [lineUniqueId];
               }else{
                  currIndx = manufBatch.length - 1;
                  if(manufSoMax != '' && manufSoMax != null && manufSoMax > 0){
                     if(parseFloat(manufBatch[currIndx].sumoftags) + parseFloat(amount) <= manufSoMax){
                           manufBatch[currIndx].sumoftags = parseFloat(manufBatch[currIndx].sumoftags) + parseFloat(amount);
                           if(manufBatch[currIndx].tags.indexOf(tag) < 0){
                              manufBatch[currIndx].tags.push(tag);
                           }
                           /*if(manufBatch[currIndx].retreqs.indexOf(rrId) < 0){
                              manufBatch[currIndx].retreqs.push(rrId);
                           }*/
                           if(manufBatch[currIndx].linesbyrr.hasOwnProperty(rrId)){
                              manufBatch[currIndx].linesbyrr[rrId].push(lineUniqueId);
                           }else{
                              manufBatch[currIndx].linesbyrr[rrId] = [lineUniqueId];
                           }
                     }else{
                        /*manufBatch.push({
                           sumoftags: amount,
                           tags: [tag],
                           retreqs: [rrId]
                        });*/
                        manufBatch.push({
                           sumoftags: amount,
                           tags: [tag],
                           linesbyrr: {}
                           //retreqs: [rrId]
                        });
                        manufBatch[manufBatch.length-1].linesbyrr[rrId] = [lineUniqueId];
                     }
                  }else{
                     manufBatch[currIndx].sumoftags = parseFloat(manufBatch[currIndx].sumoftags) + parseFloat(amount);
                     if(manufBatch[currIndx].tags.indexOf(tag) < 0){
                        manufBatch[currIndx].tags.push(tag);
                     }
                     /*if(manufBatch[currIndx].retreqs.indexOf(rrId) < 0){
                        manufBatch[currIndx].retreqs.push(rrId);
                     }*/
                     if(manufBatch[currIndx].linesbyrr.hasOwnProperty(rrId)){
                        manufBatch[currIndx].linesbyrr[rrId].push(lineUniqueId);
                     }else{
                        manufBatch[currIndx].linesbyrr[rrId] = [lineUniqueId];
                     }
                  }
               }
            }
            prevManuf = manuf;
         }
         if(!calledCreateBatchRecord){
            start += 6;//start += 1000;
            end += 6;//end += 1000;
            results = searchRs.getRange(start, end);
            if(results.length == 0){
               log.debug('test', 'called createBatchRecord END');
               createBatchRecord(prevManuf, manufBatch);
               calledCreateBatchRecord = true;
            }
            //start += 3;
            //end += 3;
            log.debug('test', 'GET ANOTHER 3 RESULTS');
            log.debug('test', 'manufBatch ' + JSON.stringify(manufBatch));
            results = searchRs.getRange(start, end);
         }
         log.debug('test', '-----------------------------------------------');
         log.debug('test', '---' + results.length + '----' + calledCreateBatchRecord);
         testCounter = parseInt(testCounter) + parseInt(1);
         log.debug('test', 'testcounter ' + testCounter);
         log.debug('test', 'testcounter ' + (testCounter) < 2);
      }while(results.length > 0 && !calledCreateBatchRecord);
      //while(testCounter < 3)
      log.debug('test', 'EXIT');
      /*if(testCounter >= 3)
         return;*/
      calledCreateBatchRecord = false;
      start = 0;
      end = 6;//1000;
      searchRs = rrLinesSearch.run();
      results = searchRs.getRange(start, end);
      if(results.length > 0){
         var scheduledScriptTask = task.create({ // rescheduling the script
         taskType: task.TaskType.SCHEDULED_SCRIPT,
         scriptId: runtime.getCurrentScript().id,
         deploymentId: runtime.getCurrentScript().deploymentId,
            /*params: {
               'script_parameter_id': recordId
            }*/
         });
      log.debug('test', 'TASK SUBMITTED');
         scheduledScriptTask.submit();
      }
      
      //log.debug('TEST', JSON.stringify(manufBatch));
   }
   function execute(scriptContext) {
      try {
         var searchId = runtime.getCurrentScript().getParameter({
            name: 'custscript_retreq_lines_for_batch'
         });
         //var scriptObj = runtime.getCurrentScript();
         /*var customerId = scriptObj.getParameter({
               name: 'script_parameter_id'
         });*/
         //searchCustomerRecord(scriptObj, customerId);
         createBatchRecords(searchId);
         return true;
      } catch (e) {
         log.debug('ERR', e.message);
      }
   }
   return {
      execute: execute
   }
});