import React from "react";
import ReactTable from 'react-table';
import PropTypes from "prop-types";
import TitleField from "./TitleField";

function TableFieldPlaceholder(props) {
  const { id, description, title, formData, arrayMask } = props;
  console.log('Table props:');
  console.log(props);

  // TODO: Implement arrayMask

  let descriptionToReturn = null;
  if (description && typeof description === "string") {
    descriptionToReturn = (
      <p id={id} className="field-description">
        { description }
      </p>
    );
  } else if (description) {
    descriptionToReturn = (
      { description }
    );
  }

  console.log('Table form data, unparsed:');
  console.log(formData);

  const reactTableColumns = Object.keys(formData[0]).map(
    (key) => {
      return {
        Header: key,
        accessor: key,
        Cell: row => (
          <div>
            <span 
              title={row.value} 
              onClick={console.log(`Clicked ID "${id}".`)}
            >
              {row.value}
            </span>
          </div>
        ),
      }
    }
  )

  console.log('Table columns:');
  console.log(reactTableColumns);

  const handleReactTableRowClick = (state, rowData) => {
    return {
      onClick: e => {
        console.log('Clicked rowInfo:', rowData);
        console.log(`ID: ${id}`);
      }
    }
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
        <ReactTable
          data={formData}
          columns={reactTableColumns}
          minRows={0}
          striped={true}
          bordered={true}
          small={true}
          filterable={true}
          showPagination={false}
          getTrProps={handleReactTableRowClick}
        />
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
