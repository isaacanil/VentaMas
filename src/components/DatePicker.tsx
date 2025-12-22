import luxonGenerateConfig from '@rc-component/picker/generate/luxon';
import { DatePicker } from 'antd';
import type { DateTime } from 'luxon';

const LuxonDatePicker = DatePicker.generatePicker<DateTime>(
  luxonGenerateConfig,
);

export default LuxonDatePicker;
