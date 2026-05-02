import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { Actions } from '../../components/Actions';
import { Root } from '../../components/Root';
import { gregorianSystem } from '../../systems/gregorian';

describe('<Calendar.Actions />', () => {
  it('renders both ClearButton and ConfirmButton in the preset', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Actions />
      </Root>
    );
    expect(getByTestId('cal.calendar.confirm')).toBeTruthy();
    expect(getByTestId('cal.calendar.clear')).toBeTruthy();
  });

  it('confirm button is disabled with no selection (single mode)', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Actions />
      </Root>
    );
    expect(
      getByTestId('cal.calendar.confirm').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('confirm button is enabled once a single date is selected', () => {
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    expect(
      getByTestId('cal.calendar.confirm').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: false }));
  });

  it('confirm button is disabled in range mode without both endpoints', () => {
    const { getByTestId } = render(
      <Root
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    expect(
      getByTestId('cal.calendar.confirm').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('confirm button is enabled in range mode once both endpoints exist', () => {
    const { getByTestId } = render(
      <Root
        initialEnd={new Date(2024, 4, 20)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    expect(
      getByTestId('cal.calendar.confirm').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: false }));
  });

  it('fires onConfirm with the selected date in single mode', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onConfirm={onConfirm}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.confirm'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'gregorian',
        date: expect.any(Date),
      })
    );
  });

  it('fires onConfirm with start/end in range mode', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root
        initialEnd={new Date(2024, 4, 20)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        onConfirm={onConfirm}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.confirm'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'gregorian',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    );
  });

  it('is a no-op when onConfirm is not provided', () => {
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    expect(() =>
      fireEvent.press(getByTestId('cal.calendar.confirm'))
    ).not.toThrow();
  });

  it('clear button wipes the selection and fires onClear', () => {
    const onClear = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onClear={onClear}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Actions />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.clear'));
    expect(onClear).toHaveBeenCalled();
    // Confirm becomes disabled after clear.
    expect(
      getByTestId('cal.calendar.confirm').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('clear button does not throw when onClear is not provided', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Actions />
      </Root>
    );
    expect(() =>
      fireEvent.press(getByTestId('cal.calendar.clear'))
    ).not.toThrow();
  });

  it('honours custom children inside the buttons', () => {
    const { getByText } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Actions.ConfirmButton>
          <Text>Apply</Text>
        </Actions.ConfirmButton>
        <Actions.ClearButton>
          <Text>Reset</Text>
        </Actions.ClearButton>
      </Root>
    );
    expect(getByText('Apply')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
  });

  it('renders without testID prefix when none is configured', () => {
    const { queryByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <Actions />
      </Root>
    );
    expect(queryByTestId('calendar.confirm')).toBeNull();
    expect(queryByTestId('calendar.clear')).toBeNull();
  });
});
