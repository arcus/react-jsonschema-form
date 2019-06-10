import { ADDITIONAL_PROPERTY_FLAG } from "../../utils";
import IconButton from "../IconButton";
import React from "react";
import PropTypes from "prop-types";
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

function SchemaFieldRender(props) {
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

class SchemaField extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // if schemas are equal idSchemas will be equal as well,
    // so it is not necessary to compare
    return !deepEquals(
      { ...this.props, idSchema: undefined },
      { ...nextProps, idSchema: undefined }
    );
  }

  allowList = [
    {
      path: ["accession", "schemaVersionNumber"]
    },
    {
      path: ["accession", "DCASigner", "affiliation", "affiliationDivision"]
    },
    {
      path: ["accession", "DCASigner", "contactInfo"],
      data: { email: "test@example.com" }
    }
  ];

  render() {
    console.log(424);

    const exampleExistingDataObject = {
      email: "test@example.com",
      example1: 123,
      example2: {
        test1: {
          example21a: "abc",
          example21b: "def",
        },
        test2: {
          example22a: "ghi"
        }
      }
    };

    const exampleMaskObject = {
      email: "test@example.com",
      example2: {
        test1: {
          example21b: "def"
        }
      }
    };

    console.log(
      JSON.stringify(mergeObjects(
        exampleExistingDataObject,
        exampleMaskObject
      ))
    );
    console.log(JSON.stringify(exampleExistingDataObject));

    console.log(
      JSON.stringify(mergeObjects(
        exampleExistingDataObject,
        exampleMaskObject
      )) === JSON.stringify(exampleExistingDataObject)
    );

    console.log(427);
    // if (this.denyList.includes(this.props.name)) {
    //     console.log(this.props.idSchema);
    //   }
    console.log(this.props.idSchema.$path);
    console.log(this.allowList);
    const allowListComparison = this.allowList.map(
      (allowSubList, index) => {
        return allowSubList.path && allowSubList.path.map(
          (value, index) => {
            // console.log(`Comparison is ${this.props.idSchema.$path[index]} vs. ${value}`);
            if (
              this.props.idSchema.$path &&
              this.props.idSchema.$path[index]
            ) {
              const allowListData = this.allowList[index] &&
                this.allowList[index].data ?
                  this.allowList[index].data :
                  null;

              console.log(444);
              console.log(index);
              console.log(allowListData);

              const doesPathElementMatch = this.props.idSchema.$path[index] ===
                value;

              console.log('doesPathElementMatch');
              console.log(doesPathElementMatch);
              // console.log(this.props.idSchema.$path[index]);
              // console.log(value);
              // console.log(typeof allowListData);
              // console.log(allowListData);
              // console.log(
              //   doesPathElementMatch &&
              //   typeof allowListData === 'object' &&
              //   allowListData !== null &&
              //   // Only perform the data check if this is the top-level element
              //   // for the path:
              //   allowSubList.path.length === this.props.idSchema.$path[index]
              // );

              if (
                doesPathElementMatch &&
                typeof allowListData === 'object' &&
                allowListData !== null &&
                // this.props.schema.type !== "array" &&
                // Only perform the data check if this is the top-level element
                // for the path:
                allowSubList.path &&
                allowSubList.path.length === this.props.idSchema.$path.length // &&
                // allowSubList.path[allowSubList.path.length - 1] ===
                //   this.props.idSchema.$path[this.props.idSchema.$path.length - 1]
              ) {
                console.log('Checking for data match...');
                console.log(allowListData);
                console.log('this.props');
                console.log(this.props);
                // console.log(this.props.idSchema.$path);
                // if (this.props.formData) {
                //   console.log('formData:');
                //   console.log(this.props.formData);
                // }

                return Object.keys(allowListData).map(key => {
                  console.log(451);
                  if (this.props.formData && this.props.formData[key]) {
                    console.log(`comparison is between ${this.props.formData[key]} and ${allowListData[key]}`);
                  }
                  console.log(this.props.formData &&
                    this.props.formData[key] !== undefined &&
                    this.props.formData[key] === allowListData[key]);
                  // console.log(this.props.formData[key]);
                  // console.log(allowListData[key]);
                  if (this.props.formData &&
                    this.props.formData[key] !== undefined
                  ) {
                    return this.props.formData[key] === allowListData[key];
                  }
                }).every(isNullOrTrue);
              }
              return doesPathElementMatch;
            }
            return null;
          }
        ).every(isNullOrTrue);
      }
    );
    console.log('allowListComparison:');
    console.log(allowListComparison);
    if (allowListComparison.some(isNullOrTrue)) {
      console.log('this.props:');
      console.log(this.props);
    }
    // Allow if this is the root element or if the element is allowed, or is a
    // parent of an allowed element:
    return this.props.idSchema.$path.length === 0 ||
        allowListComparison.some(isNullOrTrue) ?
      SchemaFieldRender(this.props) :
      null;
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
