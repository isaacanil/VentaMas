import React, { useState } from 'react';
import Modal from './Modal';

const PizzaCustomizer = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pizzaName, setPizzaName] = useState('');
  const [pizzaSize, setPizzaSize] = useState('medium');
  const [pizzaToppings, setPizzaToppings] = useState([]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleSizeChange = (event) => {
    setPizzaSize(event.target.value);
  };

  const handleToppingsChange = (event) => {
    const toppings = Array.from(event.target.selectedOptions, (option) => option.value);
    setPizzaToppings(toppings);
  };

  const handleNameChange = (event) => {
    setPizzaName(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const extraToppings = ['extra cheese', 'mushrooms', 'peppers', 'olives'];
    const costPerExtraTopping = 0.5;
    const totalExtraCost = pizzaToppings.filter((topping) => extraToppings.includes(topping)).length * costPerExtraTopping;
    const pizzaNameWithToppings = pizzaName.trim() !== '' ? `${pizzaName} (${pizzaToppings.join(', ')})` : `Pizza (${pizzaToppings.join(', ')})`;
    const totalPrice = (pizzaSize === 'small' ? 8 : pizzaSize === 'medium' ? 10 : 12) + totalExtraCost;
    alert(`Your ${pizzaSize} ${pizzaNameWithToppings} pizza is ready! Total cost: $${totalPrice.toFixed(2)}`);
    setModalOpen(false);
    setPizzaName('');
    setPizzaSize('medium');
    setPizzaToppings([]);
  };


  return (
    <>
      <button onClick={toggleModal}>Customize your pizza</button>
      {modalOpen && (
        <Modal>
          <h2>Customize your pizza</h2>
          <form onSubmit={handleSubmit}>
        <label>
          Name your pizza:
          <input type="text" value={pizzaName} onChange={handleNameChange} />
        </label>
        <br />
        <label>
          Choose your size:
          <select value={pizzaSize} onChange={handleSizeChange}>
            <option value="small">Small ($8)</option>
            <option value="medium">Medium ($10)</option>
            <option value="large">Large ($12)</option>
          </select>
        </label>
        <br />
        <label>
          Choose your toppings (up to 3, $0.50 per extra):
          <select multiple={true} value={pizzaToppings} onChange={handleToppingsChange}>
            <option value="cheese">Cheese</option>
            <option value="pepperoni">Pepperoni</option>
            <option value="sausage">Sausage</option>
            <option value="ham">Ham</option>
            <option value="pineapple">Pineapple</option>
            <option value="mushrooms">Mushrooms</option>
            <option value="peppers">Peppers</option>
            <option value="olives">Olives</option>
          </select>
        </label>
        <br />
        <button type="submit">Order your pizza!</button>
        <button type="button" onClick={toggleModal}>
          Cancel
        </button>
      </form>
    </Modal>
  )}
</>
  )};

export default PizzaCustomizer;
         

