import { ADDITIONAL_PROPERTY_FLAG } from "../../utils";
import IconButton from "../IconButton";
import React from "react";
import PropTypes from "prop-types";
import TitleField from "./TitleField";
// import DescriptionField from './DescriptionField';
import * as types from "../../types";

import {
  isMultiSelect,
  isSelect,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry,
  mergeObjects,
  getUiOptions,
  isFilesArray,
  deepEquals,
  getSchemaType,
} from "../../utils";
import UnsupportedField from "./UnsupportedField";

const REQUIRED_FIELD_SYMBOL = "*";
const COMPONENT_TYPES = {
  array: "ArrayField",
  boolean: "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  null: "NullField",
};

function performMaskComparison(
  // Expected to be of the form: [
  //   {
  //     path: ["path", "one"]
  //     id: optionalID (can also be used alongside data element)
  //   },
  //   {
  //     path: ["path", "with", "four", "elements"]
  //   },
  //   {
  //     path: ["another", "example", "path"],
  //     data: { email: "test@example.com" }
  //   }
  // ];
  maskList,
  idSchema,
  formData,
  // Whether to allow or deny the masked elements:
  deny = false
) {
  return maskList.map(
    (maskSubList, index) => {
      const maskOutcome = maskSubList.path && maskSubList.path.map(
        (value, index) => {
          // console.log(`Comparison is ${idSchema.$path[index]} vs. ${value}`);
          if (
            idSchema.$path &&
            idSchema.$path[index]
          ) {
            const maskListId = maskSubList.id ?
                maskSubList.id :
                null;

            const maskListData = maskSubList.data ?
                maskSubList.data :
                null;

            console.log(`Start of a new ${deny ? "DENY" : "ALLOW"} loop cycle, for the combination of data path "${JSON.stringify(idSchema.$path)}" and maskList path "${JSON.stringify(maskSubList.path)}", looking specifically at data element "${idSchema.$path[index]}", and maskList element "${value}"...`);
            // console.log(index);
            // console.log(maskListData);

            const doesPathElementMatch = idSchema.$path[index] ===
              value;

            // console.log('doesPathElementMatch:');
            // console.log(doesPathElementMatch);
            // console.log(idSchema.$path[index]);
            // console.log(value);
            // console.log(typeof maskListData);
            // console.log(maskListData);
            // console.log(
            //   doesPathElementMatch &&
            //   typeof maskListData === 'object' &&
            //   maskListData !== null &&
            //   // Only perform the data check if this is the top-level element
            //   // for the path:
            //   maskSubList.path.length === idSchema.$path[index]
            // );
            //
            // console.log(84);
            // console.log(maskSubList.path);
            // console.log(idSchema.$path);

            const isThisFullPath = maskSubList.path &&
              maskSubList.path.length === idSchema.$path.length &&
              JSON.stringify(maskSubList.path) ===
                 JSON.stringify(idSchema.$path) &&
              value ===
                idSchema.$path[idSchema.$path.length - 1];

            if (
              doesPathElementMatch &&
              typeof maskListData === 'object' &&
              maskListData !== null &&
              // this.props.schema.type !== "array" &&
              // Only perform the data check if this is the top-level element
              // for the path:
              isThisFullPath
            ) {
              console.log('Checking for data match...');
              // console.log(maskListData);
              // console.log(formData);
              // console.log('this.props:');
              // console.log(this.props);
              // console.log("idSchema.$path:");
              // console.log(idSchema.$path);
              // if (formData) {
              //   console.log('formData:');
              //   console.log(formData);
              // }

              console.log('formData:');
              console.log(formData);

              if (Array.isArray(formData)) {
                console.log("Processing formData as array...");
                const matchingElements = formData.map(element => {
                  return (
                    maskListId === null ||
                      maskListId === idSchema.$id
                  ) &&
                    JSON.stringify(
                      mergeObjects(element, maskListData)
                    ) === JSON.stringify(element);
                });
                console.log('matchingElements:');
                console.log(matchingElements);
                console.log('The formData to go along with those matchingElements indexes:');
                console.log(formData);
                return matchingElements;
                // return JSON.stringify(
                //   mergeObjects(formData.filter(element), maskListData)
                // ) === JSON.stringify(formData);
              }
              if (typeof maskListData === "object") {
                return (
                  maskListId === null ||
                    maskListId === idSchema.$id
                ) &&
                  JSON.stringify(
                    mergeObjects(formData, maskListData)
                  ) === JSON.stringify(formData);
              }
              // Handle, for example, strings:
              return (
                maskListId === null ||
                  maskListId === idSchema.$id
              ) &&
                JSON.stringify(maskListData) ===
                  JSON.stringify(formData);
            }

            if (deny) {
              // If deny is true, we only want to return true when we are
              // comparing a complete path, in the if() statement above.
              // Otherwise, whereas for deny=false, where we return
              // doesPathElementMatch below, we should always return false
              // here, to indicate not to deny this element:
              if (isThisFullPath) {
                return maskListId === null ||
                    maskListId === idSchema.$id;
                // return true;
              }

              return false;
            }
            return deny ? false : (
              maskListId === null ||
                maskListId === idSchema.$id
            ) &&
              doesPathElementMatch;
          }
          return null;
        }
      );

      // console.log("maskOutcome:");
      // console.log(maskOutcome);

      // if (Array.isArray(formData)) {
      //   return maskOutcome.some(isNullOrTrue);
      // }

      return maskOutcome; //.every(isNullOrTrue);
    }
  );
}

function chunkMaskComparison(
  comparisonOutput,
  underlyingDataAreArray = false,
  deny = false
) {
  if (Array.isArray(comparisonOutput)) {
    return comparisonOutput.map(element => {
      console.log('Within chunkMaskComparison, element is:');
      console.log(element);

      if (Array.isArray(element)) {
        if (deny) {
          if (underlyingDataAreArray) {
            console.log(185);
            return element.some(isTrue);
          }
          console.log(188);
          return !element.every(isNullOrFalse);
        }
        if (underlyingDataAreArray) {
          console.log(192);
          return !element.some(isFalse);
        }
        console.log(195);
        return element.every(isNullOrTrue);
      }

      if (deny) {
        return isTrue(element);
      }
      console.log(202);
      return isNullOrTrue(element);
    });
  }

  return comparisonOutput;
}

// arrayOfComparisons is expected to be an
// array of arrays:
function createArrayMaskList(arrayOfComparisons) {
  if (!Array.isArray(arrayOfComparisons)) {
    return null;
  }
  console.log(219);
  console.log('arrayOfComparisons:');
  console.log(arrayOfComparisons);

  const individualArrayMasks = arrayOfComparisons.map(individualComparison => {
    console.log('individualComparison:');
    console.log(individualComparison);
    if (!Array.isArray(individualComparison[individualComparison.length - 1])) {
      console.log(223);
      return [];
    }
    console.log(226);
    return individualComparison[individualComparison.length - 1];
  }).filter(element => element.length);

  console.log('individualArrayMasks, post-filtering:');
  console.log(individualArrayMasks);

  if (
    individualArrayMasks.length &&
      // Make sure that all comparison arrays are, as expected, the same size:
      individualArrayMasks.every(element => element.length &&
        element.length === individualArrayMasks[0].length
      )
  ) {
    console.log(237);
    // Allow values of "true" to cascade down across arrays:
    // (This allows us to set multiple allowList rules about the same array
    // field.)
    return individualArrayMasks.slice(1, individualArrayMasks.length).reduce(
      (aggregator, currentComparison) => {
        return aggregator.map((aggregatorElement, index) => {
          // return Boolean(aggregatorElement * currentComparison[index]);
          return aggregatorElement === true ||
            currentComparison[index] === true;
        });
      },
      [...individualArrayMasks[0]]
    );
  }
  console.log(249);
  return null;
}

console.log('createMaskList test:');
// console.log(createArrayMaskList([
//   [true, [true, false, false, true]],
//   [true, [true, true, false, true]],
//   [true, [true, true, false, false]]
// ]));
// console.log(createArrayMaskList([
//   [true, [true, false, false, true]],
//   [true, false],
//   [true, [true, true, false, false]]
// ]));

function getFieldComponent(schema, uiSchema, idSchema, fields) {
  const field = uiSchema["ui:field"];
  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }

  const componentName = COMPONENT_TYPES[getSchemaType(schema)];

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  return componentName in fields
    ? fields[componentName]
    : () => {
        return (
          <UnsupportedField
            schema={schema}
            idSchema={idSchema}
            reason={`Unknown field type ${schema.type}`}
          />
        );
      };
}

function Label(props) {
  const { label, required, id } = props;
  if (!label) {
    return null;
  }
  return (
    <label className="control-label" htmlFor={id}>
      {label}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
    </label>
  );
}

function LabelInput(props) {
  const { id, label, onChange } = props;
  return (
    <input
      className="form-control"
      type="text"
      id={id}
      onBlur={event => onChange(event.target.value)}
      defaultValue={label}
    />
  );
}

function Help(props) {
  const { help } = props;
  if (!help) {
    return null;
  }
  if (typeof help === "string") {
    return <p className="help-block">{help}</p>;
  }
  return <div className="help-block">{help}</div>;
}

function ErrorList(props) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return null;
  }

  return (
    <div>
      <ul className="error-detail bs-callout bs-callout-info">
        {errors
          .filter(elem => !!elem)
          .map((error, index) => {
            return (
              <li className="text-danger" key={index}>
                {error}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
function DefaultTemplate(props) {
  const {
    id,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  return (
    <WrapIfAdditional {...props}>
      {displayLabel && <Label label={label} required={required} id={id} />}
      {displayLabel && description ? description : null}
      {children}
      {errors}
      {help}
    </WrapIfAdditional>
  );
}
if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: PropTypes.string,
    classNames: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
    errors: PropTypes.element,
    rawErrors: PropTypes.arrayOf(PropTypes.string),
    help: PropTypes.element,
    rawHelp: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    description: PropTypes.element,
    rawDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    displayLabel: PropTypes.bool,
    fields: PropTypes.object,
    formContext: PropTypes.object,
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

function WrapIfAdditional(props) {
  const {
    id,
    classNames,
    disabled,
    label,
    onKeyChange,
    onDropPropertyClick,
    readonly,
    required,
    schema,
  } = props;
  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);

  if (!additional) {
    return <div className={classNames}>{props.children}</div>;
  }

  return (
    <div className={classNames}>
      <div className="row">
        <div className="col-xs-5 form-additional">
          <div className="form-group">
            <Label label={keyLabel} required={required} id={`${id}-key`} />
            <LabelInput
              label={label}
              required={required}
              id={`${id}-key`}
              onChange={onKeyChange}
            />
          </div>
        </div>
        <div className="form-additional form-group col-xs-5">
          {props.children}
        </div>
        <div className="col-xs-2">
          <IconButton
            type="danger"
            icon="remove"
            className="array-item-remove btn-block"
            tabIndex="-1"
            style={{ border: "0" }}
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
          />
        </div>
      </div>
    </div>
  );
}

function SchemaFieldRender(props, arrayMask = []) {
  const {
    uiSchema,
    formData,
    errorSchema,
    idPrefix,
    name,
    onKeyChange,
    onDropPropertyClick,
    required,
    registry = getDefaultRegistry(),
  } = props;
  const {
    definitions,
    fields,
    formContext,
    FieldTemplate = DefaultTemplate,
  } = registry;
  let idSchema = props.idSchema;
  const schema = retrieveSchema(props.schema, definitions, formData);
  idSchema = mergeObjects(
    toIdSchema(schema, null, definitions, formData, idPrefix),
    idSchema
  );
  const FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
  const { DescriptionField } = fields;
  const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  const readonly = Boolean(props.readonly || uiSchema["ui:readonly"]);
  const autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  const uiOptions = getUiOptions(uiSchema);
  let { label: displayLabel = true } = uiOptions;
  if (schema.type === "array") {
    displayLabel =
      isMultiSelect(schema, definitions) ||
      isFilesArray(schema, uiSchema, definitions);
  }
  if (schema.type === "object") {
    displayLabel = false;
  }
  if (schema.type === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }
  if (uiSchema["ui:field"]) {
    displayLabel = false;
  }

  const { __errors, ...fieldErrorSchema } = errorSchema;

  // See #439: uiSchema: Don't pass consumed class names to child components
  const field = (
    <FieldComponent
      {...props}
      idSchema={idSchema}
      schema={schema}
      uiSchema={{ ...uiSchema, classNames: undefined }}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema}
      formContext={formContext}
      rawErrors={__errors}
      arrayMask={arrayMask}
    />
  );

  const { type } = schema;
  const id = idSchema.$id;
  const path = idSchema.$path;
  const label =
    uiSchema["ui:title"] || props.schema.title || schema.title || name;
  const description =
    uiSchema["ui:description"] ||
    props.schema.description ||
    schema.description;
  const errors = __errors;
  const help = uiSchema["ui:help"];
  const hidden = uiSchema["ui:widget"] === "hidden";
  const classNames = [
    "form-group",
    "field",
    `field-${type}`,
    errors && errors.length > 0 ? "field-error has-error has-danger" : "",
    uiSchema.classNames,
  ]
    .join(" ")
    .trim();

  const fieldProps = {
    description: (
      <DescriptionField
        id={id + "__description"}
        description={description}
        formContext={formContext}
      />
    ),
    rawDescription: description,
    help: <Help help={help} />,
    rawHelp: typeof help === "string" ? help : undefined,
    errors: <ErrorList errors={errors} />,
    rawErrors: errors,
    id,
    path,
    label,
    hidden,
    onKeyChange,
    onDropPropertyClick,
    required,
    disabled,
    readonly,
    displayLabel,
    classNames,
    formContext,
    fields,
    schema,
    uiSchema,
  };

  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;

  return (
    <FieldTemplate {...fieldProps}>
      {field}

      {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
      {schema.anyOf && !isSelect(schema) && (
        <_AnyOfField
          disabled={disabled}
          errorSchema={errorSchema}
          formData={formData}
          idPrefix={idPrefix}
          idSchema={idSchema}
          onBlur={props.onBlur}
          onChange={props.onChange}
          onFocus={props.onFocus}
          options={schema.anyOf}
          baseType={schema.type}
          registry={registry}
          safeRenderCompletion={props.safeRenderCompletion}
          uiSchema={uiSchema}
        />
      )}

      {schema.oneOf && !isSelect(schema) && (
        <_OneOfField
          disabled={disabled}
          errorSchema={errorSchema}
          formData={formData}
          idPrefix={idPrefix}
          idSchema={idSchema}
          onBlur={props.onBlur}
          onChange={props.onChange}
          onFocus={props.onFocus}
          options={schema.oneOf}
          baseType={schema.type}
          registry={registry}
          safeRenderCompletion={props.safeRenderCompletion}
          uiSchema={uiSchema}
        />
      )}
    </FieldTemplate>
  );
}

const isNullOrTrue = value => value === true || value === null;
const isNullOrFalse = value => value === false || value === null;
const isTrue = value => value === true;
const isFalse = value => value === false;

class SchemaField extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // if schemas are equal idSchemas will be equal as well,
    // so it is not necessary to compare
    return !deepEquals(
      { ...this.props, idSchema: undefined },
      { ...nextProps, idSchema: undefined }
    );
  }

  render() {
    const {
      allowList = null,
      denyList = null,
      id,
      title,
      description,
      alternativeComponent = null,
      tableList = null,
      uiSchema,
      schema,
      formData,
      idSchema,
      name,
    } = this.props;

    console.log(`Now processing data path "${JSON.stringify(this.props.idSchema.$path)}"...`);
    // if (denyList.includes(this.props.name)) {
    //     console.log(this.props.idSchema);
    //   }
    // console.log(this.props.idSchema.$path);
    // console.log(this.props.formData);
    // console.log(allowList);
    // console.log(this.props.idSchema.$path);
    const allowListComparison = allowList ? performMaskComparison(
      allowList,
      this.props.idSchema,
      this.props.formData
    ) : [true];
    console.log('allowListComparison:');
    console.log(allowListComparison);
    let allowListComparisonProcessed = chunkMaskComparison(allowListComparison, Array.isArray(this.props.formData));
    console.log('allowListComparisonProcessed:');
    console.log(allowListComparisonProcessed);
    const denyListComparison = denyList ?
      allowListComparisonProcessed.some(isNullOrTrue) && performMaskComparison(
        denyList,
        this.props.idSchema,
        this.props.formData,
        true
      ) : [false];
    console.log('denyListComparison:');
    console.log(denyListComparison);
    const denyListComparisonProcessed = chunkMaskComparison(
      denyListComparison,
      Array.isArray(this.props.formData),
      true
    );
    console.log('denyListComparisonProcessed:');
    console.log(denyListComparisonProcessed);

    const arrayAllowMaskList = createArrayMaskList(allowListComparison);
    console.log('Using the following arrayAllowMaskList:');
    console.log(arrayAllowMaskList);
    const arrayDenyMaskList = createArrayMaskList(denyListComparison);
    console.log('Using the following arrayDenyMaskList:');
    console.log(arrayDenyMaskList);
    // Let deny always take precedence over allow:
    let combinedArrayMaskList = null;
    if (arrayAllowMaskList !== null && arrayDenyMaskList === null
    ) {
      combinedArrayMaskList = arrayAllowMaskList;
    }
    if (arrayAllowMaskList === null && arrayDenyMaskList !== null) {
      combinedArrayMaskList = arrayDenyMaskList.map(element => !element);
    }
    if (
      arrayAllowMaskList !== null &&
      arrayDenyMaskList !== null &&
      arrayAllowMaskList.length === arrayDenyMaskList.length
    ) {
      combinedArrayMaskList = arrayAllowMaskList.map((element, index) => {
        // "true" in the allow array means "show this element," whereas "true"
        // in the deny array means "hide this element."
        return element === true &&
          arrayDenyMaskList[index] !== true;
      });
    }
    console.log('combinedArrayMaskList:');
    console.log(combinedArrayMaskList);

    let childToRender = null;

    let descriptionToReturn = null;
    if (description && typeof description === "string") {
      descriptionToReturn = (
        <p id={id} className="field-description">
          {description}
        </p>
      );
    } else if (description) {
      descriptionToReturn = (
        { description }
      );
    }

    if (alternativeComponent) {
      childToRender = (
        <div id={id}>
          {title && (
            <TitleField
              id={`${id}__title`}
              title={title}
            />
          )}
          {descriptionToReturn}
          <div id={id} className="field-description">
            {description}
            <p className="field-description">
              This field is being rendered as a table.
            </p>
            <alternativeComponent id={id} formData={formData} />
          </div>
        </div>
      )
    }
    
    // Allow if this is the root element or if the element is allowed, or is a
    // parent of an allowed element:
    console.log('tableList is:');
    console.log(tableList);
    const renderFieldAsTable = tableList &&
      Array.isArray(tableList) &&
      tableList.map(element => {
        return element.path &&
          this.props.idSchema.$path.length ===
          element.path.length &&
          JSON.stringify(this.props.idSchema.$path) ===
          JSON.stringify(element.path);
      }).some(isTrue);

    console.log('renderfieldastable:');
    console.log(renderFieldAsTable);

    if (renderFieldAsTable && alternativeComponent) {
      const label =
        uiSchema && uiSchema["ui:title"] || schema && schema.title || name || null;
      const description =
        uiSchema && uiSchema["ui:description"] ||
        schema && schema.description || null;

      return (
        <alternativeComponent
          id={idSchema.$id}
          formData={formData}
          arrayMask={combinedArrayMaskList}
        />
      );
    }
    if (
      (
        this.props.idSchema.$path && this.props.idSchema.$path.length === 0
      ) ||
      (
        allowListComparisonProcessed.some(isTrue) &&
        !denyListComparisonProcessed.some(isTrue)
      )
    ) {
      return SchemaFieldRender(this.props, combinedArrayMaskList);
    }

    return null;
  }
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: types.registry.isRequired,
  };
}

export default SchemaField;
