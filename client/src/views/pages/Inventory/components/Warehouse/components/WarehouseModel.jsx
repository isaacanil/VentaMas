// components/WarehouseModal.jsx
import React, { useState } from "react";
import * as antd from "antd";
import WarehouseContent from "./WarehouseContent";
import ShelfContent from "./ShelfContent";
import RowShelfContent from "./RowShelfContent";
import SegmentContent from "./SegmentContent";
import { icons } from "../../../../../../constants/icons/icons";
const { Modal, Breadcrumb, Button } = antd;

export default function WarehouseModal({ warehouse, onClose }) {
  const [currentView, setCurrentView] = useState("warehouse"); // Estado para la vista actual
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [selectedRowShelf, setSelectedRowShelf] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(["Warehouse"]);

  const handleNavigate = (view, data, breadcrumb) => {
    setCurrentView(view);
  
    // Actualizar los breadcrumbs sin duplicados
    setBreadcrumbs((prevBreadcrumbs) => {
      // Filtrar los breadcrumbs que ya existen y añadir los nuevos
      const newBreadcrumbs = [...prevBreadcrumbs];
      breadcrumb.forEach((item, index) => {
        if (!newBreadcrumbs[index] || newBreadcrumbs[index] !== item) {
          newBreadcrumbs[index] = item;
        }
      });
      return newBreadcrumbs;
    });
  
    // Manejar la selección de datos para cada vista
    if (view === "shelf") setSelectedShelf(data);
    if (view === "rowShelf") setSelectedRowShelf(data);
    if (view === "segment") setSelectedSegment(data);
  };

  console.log("selectedShelf => ", selectedShelf);  
  console.log("selectedRowShelf => ", selectedRowShelf);
  console.log("selectedSegment => ", selectedSegment);
  
  const handleBack = () => {
    const viewMap = {
      segment: "rowShelf",
      rowShelf: "shelf",
      shelf: "warehouse"
    };

  
    setCurrentView(viewMap[currentView] || "warehouse");
  
    // Eliminar el último breadcrumb cuando se retrocede
    setBreadcrumbs((prevBreadcrumbs) => prevBreadcrumbs.slice(0, -1));
  };
  const renderContent = () => {
    switch (currentView) {
      case "warehouse":
        return (
          <WarehouseContent
            warehouse={warehouse}
            onNavigate={(shelf) => handleNavigate("shelf", shelf, ["Warehouse", shelf.name])}
          />
        );
      case "shelf":
        return (
          <ShelfContent
            shelf={selectedShelf}
            onNavigate={(rowShelf) => handleNavigate("rowShelf", rowShelf, ["Warehouse", selectedShelf.name, rowShelf.name])}
          />
        );
      case "rowShelf":
        return (
          <RowShelfContent
            rowShelf={selectedRowShelf}
            onNavigate={(segment) => handleNavigate("segment", segment, ["Warehouse", selectedShelf.name, selectedRowShelf.name, segment.name])}
          />
        );
      case "segment":
        return (
          <SegmentContent segment={selectedSegment} />
        );
      default:
        return null;
    }
  };
  return (
    <Modal
      width={1000}
      title={
        <div style={{ display: "flex", gap: "1em" }}>
          {
            breadcrumbs.length > 1 && (
              <Button key="back" onClick={handleBack} size="small" icon={icons.arrows.chevronLeft} />
            )
          }
          <Breadcrumb>
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item key={index}>{crumb}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
      }
      open={true}
      onCancel={onClose}
      footer={[
     
        // <Button key="close" onClick={onClose}>
        //   Cerrar
        // </Button>
      ]}
    >
      {renderContent()}
    </Modal>
  );
}
