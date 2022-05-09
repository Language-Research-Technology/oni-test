import fs from 'fs-extra';
import * as path from 'path';
import {getFile} from '../controllers/record';
import {getLogger} from "../services";
import {toArray} from "lodash";

const log = getLogger();

export async function indexFiles({crateId, item, hasFile, parent, crate, client, index, root, repository}) {
  try {
    //log.debug(`Get Files for ${hasFile['@id']}`);
    const fileId = hasFile['@id'];
    const fileProxy = crate.getItem(fileId);
    const fileItem = Object.assign({}, fileProxy);
    let fileContent = '';
    if (fileItem) {
      //Id already in fileItem
      //crate.pushValue(fileItem, 'file', {'@id': fileItem['@id']});
      fileItem._root = root;
      fileItem._crateId = crateId;
      fileItem.license = fileItem.license || item.license || parent.license;
      fileItem._parent = {
        name: item.name,
        '@id': item['@id'],
        '@type': item['@type']
      }
      if (fileItem.language) {
        for (let fileItemLanguage of toArray(fileItem.language)) {
          const languageItemProxy = crate.getItem(fileItemLanguage['@id']);
          const languageItem = Object.assign({}, languageItemProxy);
          if (languageItem) {
            crate.pushValue(item, 'language', languageItem);
            if (parent) {
              crate.pushValue(parent, 'language', languageItem);
            }
            crate.pushValue(fileItem, 'language', languageItem);
          }
        }
      }
      //TODO find csvs too all text formats
      if (fileItem['encodingFormat']) {
        // let encodingArray = [];
        // if (Array.isArray(fileItem['encodingFormat'])) {
        //   encodingArray = fileItem['encodingFormat'];
        // } else {
        //   encodingArray.push(fileItem['encodingFormat']);
        // }
        const encodingArray = crate.utils.asArray(fileItem['encodingFormat']);
        const fileItemFormat = encodingArray.find((ef) => {
          if (typeof ef === 'string') return ef.match('text/');
        });
        if (fileItemFormat) {
          const fileObj = await getFile({
            itemId: crateId,
            repository,
            filePath: fileItem['@id']
          });
          if (fileObj) {
            if (await fs.stat(path.resolve(fileObj.filePath))) {
              fileContent = await fs.readFile(path.resolve(fileObj.filePath), 'utf-8');
              //addContent(item['hasFile'], fileItem['@id'], fileContent);
            } else {
              log.debug(`path: ${fileObj.filePath} does not resolve to a file`);
            }
          }
        }
      }
      const normalFileItem = crate.getNormalizedTree(fileItem, 2);
      normalFileItem['_text'] = fileContent;
      const {body} = await client.index({
        index: index,
        body: normalFileItem
      });
    } else {
      log.warn(`No files for ${hasFile['@id']}`);
    }
  } catch (e) {
    log.error(e);
  }
}

