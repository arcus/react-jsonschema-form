import React from "react";
import PropTypes from "prop-types";
import TitleField from "./TitleField";

function TableFieldPlaceholder(props) {
  const { id, description, title } = props;
  console.log('Table props:');
  console.log(props);

  let descriptionToReturn = null;
  if (description && typeof description === "string") {
    descriptionToReturn = (
      <p id={id} className="field-description">
        {description}
      </p>
    );
  } else if (description) {
    descriptionToReturn = (
      {description}
    );
  }

  return (
    <div id={id}>
      { title && (
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
      </div>
    </div>
  )
}

if (process.env.NODE_ENV !== "production") {
  TableFieldPlaceholder.propTypes = {
    id: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  };
}

export default TableFieldPlaceholder;
