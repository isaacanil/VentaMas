import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { IoIosArrowDown } from 'react-icons/io'
import { MdClear } from 'react-icons/md'
import { SelectHead } from './SelectHead';
import { SelectBody } from './SelectBody';

export const SelectX = ({
  title,
  data,
  value,
  setValue,
  placement = 'bottom',
  property = 'name',
  reset,
  setReset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSelectTitle, setShowSelectTitle] = useState(title);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (reset) {
      setSelectedId('');
      setShowSelectTitle(title);
      setReset(false);
    }
  }, [reset, title]);

  useEffect(() => {
    if (value && data && data.Items) {
      setShowSelectTitle(value[property] || title);
      const selectedItem = data.Items.find(item => item.id === value.id);
      setSelectedId(selectedItem?.id || '');
    }
  }, [value, property, data]);



  return (
    <Container>
      <SelectHead
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        data={data}
        title={title}
        showSelectTitle={showSelectTitle}

      />
      <SelectBody
        placement={placement}
        data={data}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedId={selectedId}
        setValue={setValue}
        setSelectedId={setSelectedId}
        setShowSelectTitle={setShowSelectTitle}
        property={property}
      />
    </Container>
  );
};
const Container = styled.div`
    position: relative;
    max-width: 200px;
    width: 100%;
`

